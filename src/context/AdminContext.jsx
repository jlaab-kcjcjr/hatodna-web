import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AdminContext = createContext(null);

const RIDER_SELECT = '*, profile:profiles(full_name, phone), rider_documents(doc_type, file_path)';
const STORE_SELECT =
  '*, store_permits(permit_type, file_path), products(count), store_payouts(method, account_name, account_number, schedule, qr_payload)';
const ORDER_SELECT = '*, store:stores(name), rider:riders(profile:profiles(full_name))';
const REMITTANCE_SELECT = '*, rider:riders(town, profile:profiles(full_name, phone))';

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
  const [remittances, setRemittances] = useState([]);
  const [cashHeld, setCashHeld] = useState([]); // COD cash each rider is holding right now
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

  const loadRemittances = useCallback(async () => {
    const { data, error } = await supabase
      .from('remittances')
      .select(REMITTANCE_SELECT)
      .order('created_at', { ascending: false })
      .limit(300);
    check(error, 'Could not load remittances.');
    setRemittances(data);
  }, []);

  // Cash each rider is holding: unremitted deliveries plus remittances not handed over yet.
  const loadCashHeld = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_cash_held');
    check(error, 'Could not load cash held by riders.');
    setCashHeld(data ?? []);
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
      await Promise.all([loadOrders(), loadRemittances(), loadCashHeld()]);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, loadOrders, loadRemittances, loadCashHeld]);

  // Loading data from Supabase (an external system) is a valid use of an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  // Live orders, remittances and cash held: the lists refresh whenever something changes.
  useEffect(() => {
    if (!userId || !isAdmin) return;
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders().catch(() => {});
        loadCashHeld().catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'remittances' }, () => {
        loadRemittances().catch(() => {});
        loadCashHeld().catch(() => {});
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, loadOrders, loadRemittances, loadCashHeld]);

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

  // ---- COD remittances ----

  // Emails the rider about a shortage or its resolution. The record is already saved even if the email fails.
  const notifyRemittance = async (remittanceId) => {
    const { data, error } = await supabase.functions.invoke('notify-remittance', { body: { remittanceId } });
    return !error && !data?.error;
  };

  const mergeRemittance = (data) =>
    setRemittances((list) => list.map((r) => (r.id === data.id ? { ...r, ...data } : r)));

  // Count / verify: matches (or more) = settled, less = shortage recorded and rider notified.
  const verifyRemittance = async (id, countedAmount, note = '') => {
    const { data, error } = await supabase.rpc('admin_verify_remittance', {
      p_remittance_id: id,
      p_counted: countedAmount,
      p_note: note,
    });
    check(error, 'Could not save the count.');
    mergeRemittance(data);
    if (data.status === 'short') {
      const emailed = await notifyRemittance(id);
      if (!emailed) window.alert('The shortage was recorded, but the email to the rider could not be sent. Please call them.');
    }
    return data;
  };

  // Determine resolution, then the rider sees the updated status on their dashboard.
  const resolveShortage = async (id, resolution, note = '') => {
    const { data, error } = await supabase.rpc('admin_resolve_shortage', {
      p_remittance_id: id,
      p_resolution: resolution,
      p_note: note,
    });
    check(error, 'Could not save the resolution.');
    mergeRemittance(data);
    const emailed = await notifyRemittance(id);
    if (!emailed) window.alert('The resolution was saved, but the email to the rider could not be sent.');
    return data;
  };

  // The COD records (orders) included in one remittance.
  const getRemittanceOrders = async (id) => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, code, total, cash_collected, cash_note, rider_earning, delivered_at, store:stores(name)')
      .eq('remittance_id', id)
      .order('delivered_at');
    check(error, 'Could not load the COD records.');
    return data;
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

  // Private files (IDs, permits, proofs) open through short-lived secure links that expire after 1 hour.
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
  const pendingRemittances = remittances.filter((r) => r.status === 'submitted' || r.status === 'short').length;

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
        remittances,
        pendingRemittances,
        cashHeld,
        reloadCashHeld: loadCashHeld,
        verifyRemittance,
        resolveShortage,
        getRemittanceOrders,
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