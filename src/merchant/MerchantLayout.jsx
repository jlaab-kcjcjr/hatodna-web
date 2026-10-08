import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Receipt, UtensilsCrossed, Store, LogOut } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import BanigBand from '../components/BanigBand';

const LINKS = [
  { to: '/merchant', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/merchant/orders', label: 'Orders', icon: Receipt },
  { to: '/merchant/products', label: 'Products', icon: UtensilsCrossed },
  { to: '/merchant/settings', label: 'Store settings', icon: Store },
];

export default function MerchantLayout() {
  const { loggedIn, store, toggleOpen, logout, newCount } = useMerchant();

  if (!loggedIn) return <Navigate to="/merchant/login" replace />;

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
            className={`open-toggle${store.isOpen ? ' is-open' : ''}`}
            onClick={toggleOpen}
            title={store.isOpen ? 'Click to close your store' : 'Click to open your store'}
          >
            <span className="open-dot" />
            {store.isOpen ? 'Open for orders' : 'Store closed'}
          </button>
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