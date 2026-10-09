import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL } from '../data/adminData';
import { platformRevenue, ago } from '../utils/adminUtils';
import { peso } from '../utils/format';

const FILTERS = ['all', 'placed', 'preparing', 'ready', 'on_the_way', 'delivered', 'declined', 'cancelled'];

function CashCell({ order }) {
  const { markRemitted } = useAdmin();
  const [busy, setBusy] = useState(false);

  if (order.status !== 'delivered' || order.payment_method !== 'cod') return <span className="muted">None</span>;
  if (order.cash_remitted) return <span className="status status-delivered">Remitted</span>;

  const onClick = async () => {
    if (!window.confirm(`Confirm the rider handed over the cash for ${order.code}?`)) return;
    setBusy(true);
    try {
      await markRemitted(order.id);
    } catch (err) {
      window.alert(err.message);
      setBusy(false);
    }
  };

  return (
    <button type="button" className="btn btn-outline btn-small" disabled={busy} onClick={onClick}>
      Mark remitted
    </button>
  );
}

export default function AdminOrders() {
  const { orders } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const visible = orders
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => `${o.code} ${o.customer_name} ${o.store?.name ?? ''}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page">
      <header className="page-head">
        <h1>Orders</h1>
        <p className="muted">Every order across all stores, updating live, with what HatodNa earns from each.</p>
      </header>

      <div className="toolbar">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order code, customer, or store"
            aria-label="Search orders"
          />
        </label>
        <div className="chips" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip${filter === f ? ' active' : ''}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>No orders match.</p>
          <p className="muted small">Orders from the customer website appear here live.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Store</th>
                <th>Customer</th>
                <th>Rider</th>
                <th className="num">Total</th>
                <th className="num">HatodNa earns</th>
                <th>Status</th>
                <th>Cash</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td data-label="Order">
                    <span>
                      <strong>{o.code}</strong>
                      <span className="muted small table-sub">{ago(o.created_at)}</span>
                    </span>
                  </td>
                  <td data-label="Store">{o.store?.name ?? 'Unknown store'}</td>
                  <td data-label="Customer">{o.customer_name || 'Customer'}</td>
                  <td data-label="Rider">{o.rider?.profile?.full_name ?? 'Not assigned'}</td>
                  <td data-label="Total" className="num">
                    {peso(o.total)}
                  </td>
                  <td data-label="HatodNa earns" className="num">
                    {peso(platformRevenue(o))}
                  </td>
                  <td data-label="Status">
                    <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td data-label="Cash">
                    <CashCell order={o} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}