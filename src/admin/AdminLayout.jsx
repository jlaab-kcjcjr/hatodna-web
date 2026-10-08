import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Bike, Store, Receipt, SlidersHorizontal, LogOut } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import BanigBand from '../components/BanigBand';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/riders', label: 'Riders', icon: Bike, badge: 'riders' },
  { to: '/admin/stores', label: 'Stores', icon: Store, badge: 'stores' },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/settings', label: 'Fees and settings', icon: SlidersHorizontal },
];

export default function AdminLayout() {
  const { loggedIn, logout, pendingRiders, pendingStores } = useAdmin();

  if (!loggedIn) return <Navigate to="/admin/login" replace />;

  const badges = { riders: pendingRiders, stores: pendingStores };

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
          <button type="button" className="nav-link" onClick={logout}>
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