import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL } from '../data/adminData';
import { platformRevenue, ago } from '../utils/adminUtils';
import { peso, isToday, greeting } from '../utils/format';

export default function AdminOverview() {
  const { riders, stores, orders, settings, pendingRiders, pendingStores } = useAdmin();
  const storeById = Object.fromEntries(stores.map((s) => [s.id, s]));

  const today = orders.filter((o) => isToday(o.createdAt) && o.status !== 'cancelled');
  const sales = today.reduce((sum, o) => sum + o.subtotal, 0);
  const revenue = today.reduce((sum, o) => sum + platformRevenue(o, storeById[o.storeId], settings), 0);
  const activeRiders = riders.filter((r) => r.status === 'approved').length;
  const activeStores = stores.filter((s) => s.status === 'active').length;
  const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const attention = [
    { label: 'Rider applications to review', count: pendingRiders, to: '/admin/riders' },
    { label: 'Store applications to review', count: pendingStores, to: '/admin/stores' },
    { label: 'Orders still being prepared', count: orders.filter((o) => o.status === 'preparing').length, to: '/admin/orders' },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <p className="greet">{greeting()}, JLAAB team</p>
        <h1>Platform overview</h1>
      </header>

      <p className="banner banner-info">
        Demo data: until the backend is connected, changes here don't reach the rider and partner websites yet.
      </p>

      <div className="stats stats-4">
        <div className="stat stat-feature">
          <p className="stat-label">HatodNa revenue today</p>
          <p className="stat-value">{peso(revenue)}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Sales today</p>
          <p className="stat-value">{peso(sales)}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Orders today</p>
          <p className="stat-value">{today.length}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Active riders / stores</p>
          <p className="stat-value">
            {activeRiders} / {activeStores}
          </p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Needs your attention</h2>
          </div>
          {attention.map((a) => (
            <Link key={a.label} to={a.to} className="attention-row">
              <span className="attention-count">{a.count}</span>
              <span className="attention-label">{a.label}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders" className="link">
              See all orders
            </Link>
          </div>
          {recent.map((o) => (
            <div key={o.id} className="mini-order">
              <div>
                <strong>{o.code}</strong> <span className="muted">{storeById[o.storeId]?.name}</span>
                <p className="muted small">
                  {o.customer}, {ago(o.createdAt)}
                </p>
              </div>
              <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}