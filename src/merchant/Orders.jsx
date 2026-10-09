import { useEffect, useState } from 'react';
import { useMerchant } from '../context/MerchantContext';
import { peso, timeAgo } from '../utils/format';

const TABS = [
  { key: 'new', label: 'New', statuses: ['placed'], empty: 'No new orders right now.' },
  { key: 'preparing', label: 'Preparing', statuses: ['preparing'], empty: 'Nothing is being prepared.' },
  { key: 'ready', label: 'Ready for pickup', statuses: ['ready'], empty: 'No orders waiting for a rider.' },
  { key: 'delivery', label: 'Out for delivery', statuses: ['on_the_way'], empty: 'No orders on the road.' },
  { key: 'done', label: 'Completed', statuses: ['delivered'], empty: 'No completed orders yet.' },
  { key: 'declined', label: 'Declined or cancelled', statuses: ['declined', 'cancelled'], empty: 'Nothing here.' },
];

const DECLINE_REASONS = ['An item is sold out', 'Too busy right now', 'Closing soon'];

function OrderCard({ order }) {
  const { orderAction } = useMerchant();
  const [declining, setDeclining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const items = order.order_items ?? [];
  const youReceive = Number(order.subtotal) - Number(order.commission_amount);

  const act = async (action, reason) => {
    setBusy(true);
    setError('');
    try {
      await orderAction(order.id, action, reason);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`order${order.status === 'placed' ? ' order-new' : ''}`}>
      <header className="order-head">
        <div>
          <p className="order-code">{order.code}</p>
          <p className="muted small">{timeAgo(order.created_at)}</p>
        </div>
        <div className="order-money">
          <p className="order-total">{peso(order.subtotal)}</p>
          <p className="muted small">You receive {peso(youReceive)}</p>
        </div>
      </header>

      <p className="order-customer">
        {order.customer_name || 'Customer'}
        <span className="muted">
          , {order.address}
          {order.landmark ? ` (${order.landmark})` : ''}
        </span>
      </p>

      <ul className="order-items">
        {items.map((i) => (
          <li key={i.id}>
            <span className="qty">{i.qty}×</span>
            {i.name}
            <span className="muted">{peso(Number(i.price) * i.qty)}</span>
          </li>
        ))}
      </ul>

      {order.note && <p className="order-note">Note: {order.note}</p>}
      {order.status === 'declined' && <p className="muted small">Declined: {order.decline_reason}</p>}
      {order.status === 'cancelled' && <p className="muted small">Cancelled by the customer.</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="order-actions">
        {order.status === 'placed' && !declining && (
          <>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setDeclining(true)}>
              Decline
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act('accept')}>
              Accept and prepare
            </button>
          </>
        )}
        {order.status === 'placed' && declining && (
          <div className="decline-box">
            <p className="small">Why are you declining this order?</p>
            <div className="decline-reasons">
              {DECLINE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className="chip"
                  disabled={busy}
                  onClick={() => act('decline', reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button type="button" className="link-btn" onClick={() => setDeclining(false)}>
              Keep this order
            </button>
          </div>
        )}
        {order.status === 'preparing' && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act('ready')}>
            Mark ready for pickup
          </button>
        )}
        {order.status === 'ready' && (
          <p className="order-waiting">
            {order.rider_id ? 'A rider is on the way to pick this up.' : 'Finding a rider near you...'}
          </p>
        )}
        {order.status === 'on_the_way' && <p className="order-waiting">The rider is delivering this order.</p>}
      </div>
    </article>
  );
}

export default function Orders() {
  const { orders, store } = useMerchant();
  const [tab, setTab] = useState('new');
  const [, setTick] = useState(0);

  // Refresh the "5 min ago" labels every 30 seconds.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const currentTab = TABS.find((t) => t.key === tab);
  const visible = orders.filter((o) => currentTab.statuses.includes(o.status));
  const countOf = (t) => orders.filter((o) => t.statuses.includes(o.status)).length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Orders</h1>
        <p className="muted">
          {store.is_open
            ? 'New orders appear here instantly with a sound. Accept them quickly so a rider can be assigned.'
            : 'Your store is closed, so no new orders will come in.'}
        </p>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {countOf(t) > 0 && <span className="tab-count">{countOf(t)}</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>{currentTab.empty}</p>
          <p className="muted small">Keep this page open while your store is open, so you hear new orders.</p>
        </div>
      ) : (
        <div className="order-grid">
          {visible.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}