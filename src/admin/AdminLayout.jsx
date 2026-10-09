import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Bike, Store, Inbox, Receipt, SlidersHorizontal, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import BanigBand from '../components/BanigBand';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/riders', label: 'Riders', icon: Bike, badge: 'riders' },
  { to: '/admin/stores', label: 'Stores', icon: Store, badge: 'stores' },
  { to: '/admin/applications', label: 'Partner applications', icon: Inbox, badge: 'applications' },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/settings', label: 'Fees and settings', icon: SlidersHorizontal },
];

export default function AdminLayout() {
  const { session, profile, loading: authLoading, profileLoading, signOut } = useAuth();
  const { loading, loadError, reload, pendingRiders, pendingStores, newApplications } = useAdmin();

  if (authLoading || (session && profileLoading)) return <p className="page-loading">Loading...</p>;
  if (!session || profile?.role !== 'admin') return <Navigate to="/admin/login" replace />;
  if (loading) return <p className="page-loading">Loading the dashboard...</p>;

  if (loadError) {
    return (
      <div className="setup">
        <main className="setup-body">
          <section className="card setup-status">
            <h1>Something went wrong</h1>
            <p className="muted setup-text">{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={reload}>
              Try again
            </button>
          </section>
        </main>
      </div>
    );
  }

  const badges = { riders: pendingRiders, stores: pendingStores, applications: newApplications };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="sidebar-brand">HatodNa!</p>
          <p className="sidebar-sub">Admin dashboard</p>
        </div>
        <BanigBand id="admin-sidebar-band" height={10} />

        <nav className="nav" aria-label="Admin">
          {LINKS.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
              {badge && badges[badge] > 0 && <span className="nav-badge">{badges[badge]}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button type="button" className="nav-link" onClick={reload}>
            <RefreshCw size={18} aria-hidden="true" />
            <span>Refresh data</span>
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