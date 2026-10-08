import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_LOGIN, INITIAL_STORE, INITIAL_PRODUCTS, SAMPLE_CUSTOMERS } from '../data/merchantData';
import { playChime } from '../utils/chime';

const STORAGE_KEY = 'hatodna-merchant-v1';
const DEMO_ORDER_EVERY_MS = 45000;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const MerchantContext = createContext(null);

export function MerchantProvider({ children }) {
  const [saved] = useState(loadSaved);
  const [loggedIn, setLoggedIn] = useState(saved?.loggedIn ?? false);
  const [store, setStore] = useState(saved?.store ?? INITIAL_STORE);
  const [products, setProducts] = useState(saved?.products ?? INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(saved?.orders ?? []);

  // Demo only: keeps data after a page refresh. Later, the backend stores this.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ loggedIn, store, products, orders }));
    } catch {
      // Storage is full or blocked; the portal still works for this session.
    }
  }, [loggedIn, store, products, orders]);

  const login = (email, password) => {
    const ok = email.trim().toLowerCase() === DEMO_LOGIN.email && password === DEMO_LOGIN.password;
    if (ok) setLoggedIn(true);
    return ok;
  };

  const logout = () => setLoggedIn(false);

  const updateStore = (changes) => setStore((s) => ({ ...s, ...changes }));
  const toggleOpen = () => setStore((s) => ({ ...s, isOpen: !s.isOpen }));

  const saveProduct = (product) => {
    if (product.id) {
      setProducts((list) => list.map((p) => (p.id === product.id ? product : p)));
    } else {
      setProducts((list) => [{ ...product, id: `p${Date.now()}` }, ...list]);
    }
  };

  const deleteProduct = (id) => setProducts((list) => list.filter((p) => p.id !== id));

  const toggleAvailable = (id) =>
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));

  const setStatus = (id, status, extra = {}) =>
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status, ...extra, updatedAt: Date.now() } : o)));

  const acceptOrder = (id) => setStatus(id, 'preparing');
  const declineOrder = (id, reason) => setStatus(id, 'declined', { declineReason: reason });
  const markReady = (id) => setStatus(id, 'ready');
  const markPickedUp = (id) => setStatus(id, 'completed');

  // Demo only: creates a sample order. Later, real orders come from the customer app.
  const simulateOrder = () => {
    const available = products.filter((p) => p.available);
    if (available.length === 0) return;
    const count = 1 + Math.floor(Math.random() * Math.min(3, available.length));
    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, count);
    const items = picked.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      qty: 1 + Math.floor(Math.random() * 2),
    }));
    const customer = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
    const order = {
      id: `o${Date.now()}`,
      code: `HN-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: customer.name,
      address: customer.address,
      note: customer.note,
      items,
      subtotal: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      status: 'new',
      createdAt: Date.now(),
    };
    setOrders((list) => [order, ...list]);
    playChime();
  };

    useEffect(() => {
    if (!loggedIn || !store.isOpen) return;
    const t = setInterval(simulateOrder, DEMO_ORDER_EVERY_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, store.isOpen, products]);

  const newCount = orders.filter((o) => o.status === 'new').length;

  return (
    <MerchantContext.Provider
      value={{
        loggedIn,
        store,
        products,
        orders,
        newCount,
        login,
        logout,
        updateStore,
        toggleOpen,
        saveProduct,
        deleteProduct,
        toggleAvailable,
        acceptOrder,
        declineOrder,
        markReady,
        markPickedUp,
        simulateOrder,
      }}
    >
      {children}
    </MerchantContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMerchant = () => useContext(MerchantContext);