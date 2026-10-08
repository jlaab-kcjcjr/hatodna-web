import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL } from '../data/adminData';
import { platformRevenue, ago } from '../utils/adminUtils';
import { peso } from '../utils/format';

const FILTERS = ['all', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { orders, stores, riders, settings } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const storeById = Object.fromEntries(stores.map((s) => [s.id, s]));
  const riderById = Object.fromEntries(riders.map((r) => [r.id, r]));

  const visible = [...orders]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) =>
      `${o.code} ${o.customer} ${storeById[o.storeId]?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="page">
      <header className="page-head">
        <h1>Orders</h1>
        <p className="muted">Every order across all stores, with what HatodNa earns from each.</p>
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
          <p className="muted small">Try another search or status.</p>
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
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td data-label="Order">
                    <span>
                      <strong>{o.code}</strong>
                      <span className="muted small table-sub">{ago(o.createdAt)}</span>
                    </span>
                  </td>
                  <td data-label="Store">{storeById[o.storeId]?.name ?? 'Unknown store'}</td>
                  <td data-label="Customer">{o.customer}</td>
                  <td data-label="Rider">{o.riderId ? riderById[o.riderId]?.name : 'Not assigned'}</td>
                  <td data-label="Total" className="num">
                    {peso(o.subtotal + o.deliveryFee + settings.serviceFee)}
                  </td>
                  <td data-label="HatodNa earns" className="num">
                    {peso(platformRevenue(o, storeById[o.storeId], settings))}
                  </td>
                  <td data-label="Status">
                    <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
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