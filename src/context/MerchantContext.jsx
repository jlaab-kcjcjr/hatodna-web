import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { uploadImage, uploadDocument } from '../utils/images';
import { playChime } from '../utils/chime';

const MerchantContext = createContext(null);
const ORDER_SELECT = '*, order_items(*)';

function check(error, fallback) {
  if (error) throw new Error(error.message || fallback);
}

export function MerchantProvider({ children }) {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const isMerchant = profile?.role === 'merchant' || profile?.role === 'admin';

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [hours, setHours] = useState([]);
  const [permits, setPermits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadAll = useCallback(async () => {
    if (!userId || !isMerchant) {
      setStore(null);
      setProducts([]);
      setHours([]);
      setPermits([]);
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at')
        .limit(1);
      check(error, 'Could not load your store.');
      const myStore = stores[0] ?? null;
      setStore(myStore);

      if (myStore) {
        const [p, h, pm, o] = await Promise.all([
          supabase.from('products').select('*').eq('store_id', myStore.id).order('created_at', { ascending: false }),
          supabase.from('store_hours').select('*').eq('store_id', myStore.id).order('day_of_week'),
          supabase.from('store_permits').select('*').eq('store_id', myStore.id),
          supabase
            .from('orders')
            .select(ORDER_SELECT)
            .eq('store_id', myStore.id)
            .order('created_at', { ascending: false })
            .limit(200),
        ]);
        check(p.error, 'Could not load your products.');
        check(h.error, 'Could not load your hours.');
        check(pm.error, 'Could not load your permits.');
        check(o.error, 'Could not load your orders.');
        setProducts(p.data);
        setHours(h.data);
        setPermits(pm.data);
        setOrders(o.data);
      }
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, isMerchant]);

  // Loading data from Supabase (an external system) is a valid use of an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  // Live orders: new orders appear instantly with a chime, and status changes update on their own.
  const storeId = store?.id;
  useEffect(() => {
    if (!storeId) return;
    const channel = supabase
      .channel(`store-orders-${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', payload.new.id).single();
            if (data) {
              setOrders((list) => (list.some((o) => o.id === data.id) ? list : [data, ...list]));
              playChime();
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders((list) => list.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o)));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  // Creates the store, its default hours, and uploads the permits chosen in the form.
  const registerStore = async (form, permitFiles = {}) => {
    const { data, error } = await supabase.from('stores').insert(form).select().single();
    check(error, 'Could not register your store.');
    try {
      const defaultHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        store_id: data.id,
        day_of_week: day,
        open_time: '07:00',
        close_time: '20:00',
        is_closed: false,
      }));
      await supabase.from('store_hours').insert(defaultHours);
      for (const [permitType, file] of Object.entries(permitFiles)) {
        const path = await uploadDocument('store-permits', userId, file, permitType);
        await supabase
          .from('store_permits')
          .upsert({ store_id: data.id, permit_type: permitType, file_path: path }, { onConflict: 'store_id,permit_type' });
      }
    } catch (err) {
      // The store is already saved. Any permit that didn't upload can be added on the next screen.
      console.error('Store registered, but a follow-up step failed:', err);
    } finally {
      await loadAll();
    }
  };

  const updateStore = async (changes) => {
    const { data, error } = await supabase.from('stores').update(changes).eq('id', store.id).select().single();
    check(error, 'Could not save your store details.');
    setStore(data);
  };

  const toggleOpen = () => updateStore({ is_open: !store.is_open });

  const saveHours = async (rows) => {
    const { data, error } = await supabase
      .from('store_hours')
      .upsert(rows.map((r) => ({ ...r, store_id: store.id })), { onConflict: 'store_id,day_of_week' })
      .select();
    check(error, 'Could not save your opening hours.');
    setHours([...data].sort((a, b) => a.day_of_week - b.day_of_week));
  };

  // Uploads a permit privately, then saves (or replaces) it for this store.
  const uploadPermit = async (permitType, file) => {
    const path = await uploadDocument('store-permits', userId, file, permitType);
    const { data, error } = await supabase
      .from('store_permits')
      .upsert(
        { store_id: store.id, permit_type: permitType, file_path: path, uploaded_at: new Date().toISOString() },
        { onConflict: 'store_id,permit_type' }
      )
      .select()
      .single();
    check(error, 'The file was uploaded, but it could not be saved to your store.');
    setPermits((list) => [...list.filter((p) => p.permit_type !== permitType), data]);
  };

  // Private files open through short-lived secure links that expire after 1 hour.
  const getPermitUrls = async (list) => {
    const entries = await Promise.all(
      list.map(async (p) => {
        const { data } = await supabase.storage.from('store-permits').createSignedUrl(p.file_path, 3600);
        return [p.permit_type, data?.signedUrl ?? ''];
      })
    );
    return Object.fromEntries(entries);
  };

  const saveProduct = async (product, imageFile) => {
    let imagePath = product.image_path ?? null;
    if (imageFile) imagePath = await uploadImage('product-images', userId, imageFile);
    const row = {
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      is_available: product.is_available,
      image_path: imagePath,
    };
    if (product.id) {
      const { data, error } = await supabase.from('products').update(row).eq('id', product.id).select().single();
      check(error, 'Could not save the product.');
      setProducts((list) => list.map((p) => (p.id === data.id ? data : p)));
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...row, store_id: store.id })
        .select()
        .single();
      check(error, 'Could not add the product.');
      setProducts((list) => [data, ...list]);
    }
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    check(error, 'Could not delete the product.');
    setProducts((list) => list.filter((p) => p.id !== id));
  };

  const toggleAvailable = async (product) => {
    const { data, error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id)
      .select()
      .single();
    check(error, 'Could not update the product.');
    setProducts((list) => list.map((p) => (p.id === data.id ? data : p)));
  };

  // Accept, decline, or mark ready. The database checks that the action is allowed.
  const orderAction = async (orderId, action, reason = '') => {
    const { data, error } = await supabase.rpc('merchant_update_order', {
      p_order_id: orderId,
      p_action: action,
      p_reason: reason,
    });
    check(error, 'Could not update the order.');
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, ...data } : o)));
  };

  const newCount = orders.filter((o) => o.status === 'placed').length;

  return (
    <MerchantContext.Provider
      value={{
        store,
        products,
        hours,
        permits,
        orders,
        loading,
        loadError,
        newCount,
        reload: loadAll,
        registerStore,
        updateStore,
        toggleOpen,
        saveHours,
        uploadPermit,
        getPermitUrls,
        saveProduct,
        deleteProduct,
        toggleAvailable,
        orderAction,
      }}
    >
      {children}
    </MerchantContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMerchant = () => useContext(MerchantContext);