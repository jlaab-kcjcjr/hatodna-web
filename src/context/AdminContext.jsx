import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_ADMIN, DEFAULT_SETTINGS, INITIAL_RIDERS, INITIAL_STORES, INITIAL_ORDERS } from '../data/adminData';

const STORAGE_KEY = 'hatodna-admin-v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [saved] = useState(loadSaved);
  const [loggedIn, setLoggedIn] = useState(saved?.loggedIn ?? false);
  const [riders, setRiders] = useState(saved?.riders ?? INITIAL_RIDERS);
  const [stores, setStores] = useState(saved?.stores ?? INITIAL_STORES);
  const [orders, setOrders] = useState(saved?.orders ?? INITIAL_ORDERS);
  const [settings, setSettings] = useState(saved?.settings ?? DEFAULT_SETTINGS);

  // Demo only: keeps changes after a refresh. Later, the backend stores this.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ loggedIn, riders, stores, orders, settings }));
    } catch {
      // Storage is blocked; the dashboard still works for this visit.
    }
  }, [loggedIn, riders, stores, orders, settings]);

  const login = (email, password) => {
    const ok = email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
    if (ok) setLoggedIn(true);
    return ok;
  };

  const logout = () => setLoggedIn(false);

  const setRiderStatus = (id, status, note = '') =>
    setRiders((list) => list.map((r) => (r.id === id ? { ...r, status, note, reviewedAt: Date.now() } : r)));

  const setStoreStatus = (id, status, note = '', changes = {}) =>
    setStores((list) =>
      list.map((s) => (s.id === id ? { ...s, ...changes, status, note, reviewedAt: Date.now() } : s))
    );

  const setStoreCommission = (id, commissionPercent) =>
    setStores((list) => list.map((s) => (s.id === id ? { ...s, commissionPercent } : s)));

  const updateSettings = (changes) => setSettings((s) => ({ ...s, ...changes }));

  const resetDemo = () => {
    setRiders(INITIAL_RIDERS);
    setStores(INITIAL_STORES);
    setOrders(INITIAL_ORDERS);
    setSettings(DEFAULT_SETTINGS);
  };

  const pendingRiders = riders.filter((r) => r.status === 'pending').length;
  const pendingStores = stores.filter((s) => s.status === 'pending').length;

  return (
    <AdminContext.Provider
      value={{
        loggedIn,
        riders,
        stores,
        orders,
        settings,
        pendingRiders,
        pendingStores,
        login,
        logout,
        setRiderStatus,
        setStoreStatus,
        setStoreCommission,
        updateSettings,
        resetDemo,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => useContext(AdminContext);