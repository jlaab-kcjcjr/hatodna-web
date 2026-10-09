import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AdminContext = createContext(null);

const RIDER_SELECT = '*, profile:profiles(full_name, phone), rider_documents(doc_type, file_path)';
const STORE_SELECT = '*, store_permits(permit_type, file_path), products(count)';
const ORDER_SELECT = '*, store:stores(name), rider:riders(profile:profiles(full_name))';

function check(error, fallback) {
  if (error) throw new Error(error.message || fallback);
}

export function AdminProvider({ children }) {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const isAdmin = profile?.role === 'admin';

  const [riders, setRiders] = useState([]);
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false })
      .limit(300);
    check(error, 'Could not load orders.');
    setOrders(data);
  }, []);

  const loadAll = useCallback(async () => {
    if (!userId || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const [r, s, a, st] = await Promise.all([
        supabase.from('riders').select(RIDER_SELECT).order('created_at', { ascending: false }),
        supabase.from('stores').select(STORE_SELECT).order('created_at', { ascending: false }),
        supabase.from('partner_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('platform_settings').select('*').eq('id', 1).single(),
      ]);
      check(r.error, 'Could not load riders.');
      check(s.error, 'Could not load stores.');
      check(a.error, 'Could not load partner applications.');
      check(st.error, 'Could not load fees.');
      setRiders(r.data);
      setStores(s.data);
      setApplications(a.data);
      setSettings(st.data);
      await loadOrders();
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, loadOrders]);

  // Loading data from Supabase (an external system) is a valid use of an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  // Live orders: the list refreshes whenever any order is placed or changes status.
  useEffect(() => {
    if (!userId || !isAdmin) return;
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders().catch(() => {});
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, loadOrders]);

  // Emails the rider about the decision. The status is already saved even if the email fails.
  const notifyRider = async (riderId) => {
    const { data, error } = await supabase.functions.invoke('notify-rider', { body: { riderId } });
    return !error && !data?.error;
  };

    const setRiderStatus = async (id, status, note = '', extra = {}) => {
    const changes = { ...extra, status, status_note: note, reviewed_at: new Date().toISOString() };
    if (status !== 'approved') changes.is_online = false;
    const { data, error } = await supabase.from('riders').update(changes).eq('id', id).select().single();
    check(error, 'Could not update the rider.');
    setRiders((list) => list.map((r) => (r.id === id ? { ...r, ...data } : r)));

    if (['orientation', 'approved', 'rejected', 'suspended'].includes(status)) {
      const emailed = await notifyRider(id);
      if (!emailed) {
        window.alert('The rider was updated, but the email could not be sent. Please contact them by phone instead.');
      }
    }
  };

  // Emails the store owner about the decision. The status is already saved even if the email fails.
  const notifyStoreOwner = async (storeId) => {
    const { data, error } = await supabase.functions.invoke('notify-store', { body: { storeId } });
    return !error && !data?.error;
  };

  const setStoreStatus = async (id, status, note = '', extra = {}) => {
    const changes = { ...extra, status, status_note: note, reviewed_at: new Date().toISOString() };
    if (status !== 'active') changes.is_open = false;
    const { data, error } = await supabase.from('stores').update(changes).eq('id', id).select().single();
    check(error, 'Could not update the store.');
    setStores((list) => list.map((s) => (s.id === id ? { ...s, ...data } : s)));

    if (['active', 'rejected', 'suspended'].includes(status)) {
      const emailed = await notifyStoreOwner(id);
      if (!emailed) {
        window.alert(
          `${data.name} was updated, but the email to the owner could not be sent. Please call them at ${data.phone || 'their number'} instead.`
        );
      }
    }
  };

  const setStoreCommission = async (id, commissionPercent) => {
    const { data, error } = await supabase
      .from('stores')
      .update({ commission_percent: commissionPercent })
      .eq('id', id)
      .select()
      .single();
    check(error, 'Could not save the commission.');
    setStores((list) => list.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const setApplicationStatus = async (id, status) => {
    const { data, error } = await supabase
      .from('partner_applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    check(error, 'Could not update the application.');
    setApplications((list) => list.map((a) => (a.id === id ? data : a)));
  };

  const markRemitted = async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ cash_remitted: true })
      .eq('id', orderId)
      .select()
      .single();
    check(error, 'Could not mark the cash as remitted.');
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, ...data } : o)));
  };

  const updateSettings = async (changes) => {
    const { data, error } = await supabase
      .from('platform_settings')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    check(error, 'Could not save the fees.');
    setSettings(data);
  };

  // Private files (IDs, permits) open through short-lived secure links that expire after 1 hour.
  const getFileUrls = async (bucket, files) => {
    const entries = await Promise.all(
      files.map(async ({ key, path }) => {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
        return [key, data?.signedUrl ?? ''];
      })
    );
    return Object.fromEntries(entries);
  };

  const pendingRiders = riders.filter((r) => r.status === 'pending').length;
  const pendingStores = stores.filter((s) => s.status === 'pending').length;
  const newApplications = applications.filter((a) => a.status === 'new').length;

  return (
    <AdminContext.Provider
      value={{
        riders,
        stores,
        orders,
        applications,
        settings,
        loading,
        loadError,
        pendingRiders,
        pendingStores,
        newApplications,
        reload: loadAll,
        setRiderStatus,
        setStoreStatus,
        setStoreCommission,
        setApplicationStatus,
        markRemitted,
        updateSettings,
        getFileUrls,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => useContext(AdminContext);