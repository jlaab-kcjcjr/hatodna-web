import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Receipt, UtensilsCrossed, Store, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMerchant } from '../context/MerchantContext';
import BanigBand from '../components/BanigBand';
import StoreSetup, { SetupShell } from './StoreSetup';

const LINKS = [
  { to: '/merchant', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/merchant/orders', label: 'Orders', icon: Receipt },
  { to: '/merchant/products', label: 'Products', icon: UtensilsCrossed },
  { to: '/merchant/settings', label: 'Store settings', icon: Store },
];

export default function MerchantLayout() {
  const { session, profile, loading: authLoading, profileLoading, signOut } = useAuth();
  const { store, loading, loadError, toggleOpen, newCount, reload } = useMerchant();

  if (authLoading || (session && profileLoading)) return <p className="page-loading">Loading...</p>;
  if (!session) return <Navigate to="/merchant/login" replace />;

  if (!profile) {
    return (
      <SetupShell>
        <section className="card setup-status">
          <h1>We couldn't load your account</h1>
          <p className="muted setup-text">Please log out and log in again.</p>
        </section>
      </SetupShell>
    );
  }

  if (profile.role !== 'merchant' && profile.role !== 'admin') {
    return (
      <SetupShell>
        <section className="card setup-status">
          <h1>This isn't a partner account</h1>
          <p className="muted setup-text">
            You're logged in with a customer or rider account. Log out, then create a partner account with a
            different email.
          </p>
        </section>
      </SetupShell>
    );
  }

  if (loading) return <p className="page-loading">Loading your store...</p>;

  if (loadError) {
    return (
      <SetupShell>
        <section className="card setup-status">
          <h1>Something went wrong</h1>
          <p className="muted setup-text">{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>
            Try again
          </button>
        </section>
      </SetupShell>
    );
  }

  if (!store || store.status !== 'active') return <StoreSetup />;

  const onToggle = async () => {
    try {
      await toggleOpen();
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="sidebar-brand">HatodNa!</p>
          <p className="sidebar-sub">Partner portal</p>
        </div>
        <BanigBand id="sidebar-band" height={10} />
        <div className="sidebar-store">
          <p className="sidebar-store-name">{store.name}</p>
          <p className="sidebar-store-addr">{store.address}</p>
        </div>

        <nav className="nav" aria-label="Partner portal">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
              {to === '/merchant/orders' && newCount > 0 && <span className="nav-badge">{newCount}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button
            type="button"
            className={`open-toggle${store.is_open ? ' is-open' : ''}`}
            onClick={onToggle}
            title={store.is_open ? 'Click to close your store' : 'Click to open your store'}
          >
            <span className="open-dot" />
            {store.is_open ? 'Open for orders' : 'Store closed'}
          </button>
          <button type="button" className="nav-link" onClick={signOut}>
            <LogOut size={18} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}