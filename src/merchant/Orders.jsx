import { useEffect, useState } from 'react';
import { useMerchant } from '../context/MerchantContext';
import { peso, timeAgo } from '../utils/format';

const TABS = [
  { key: 'new', label: 'New', empty: 'No new orders right now.' },
  { key: 'preparing', label: 'Preparing', empty: 'Nothing is being prepared.' },
  { key: 'ready', label: 'Ready for pickup', empty: 'No orders waiting for a rider.' },
  { key: 'completed', label: 'Completed', empty: 'No completed orders yet.' },
  { key: 'declined', label: 'Declined', empty: 'No declined orders.' },
];

const DECLINE_REASONS = ['An item is sold out', 'Too busy right now', 'Closing soon'];

function OrderCard({ order }) {
  const { acceptOrder, declineOrder, markReady, markPickedUp } = useMerchant();
  const [declining, setDeclining] = useState(false);

  return (
    <article className={`order order-${order.status}`}>
      <header className="order-head">
        <div>
          <p className="order-code">{order.code}</p>
          <p className="muted small">{timeAgo(order.createdAt)}</p>
        </div>
        <p className="order-total">{peso(order.subtotal)}</p>
      </header>

      <p className="order-customer">
        {order.customer}
        <span className="muted">, {order.address}</span>
      </p>

      <ul className="order-items">
        {order.items.map((i) => (
          <li key={i.id}>
            <span className="qty">{i.qty}×</span>
            {i.name}
            <span className="muted">{peso(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>

      {order.note && <p className="order-note">Note: {order.note}</p>}
      {order.status === 'declined' && <p className="muted small">Declined: {order.declineReason}</p>}

      <div className="order-actions">
        {order.status === 'new' && !declining && (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeclining(true)}>
              Decline
            </button>
            <button type="button" className="btn btn-primary" onClick={() => acceptOrder(order.id)}>
              Accept and prepare
            </button>
          </>
        )}
        {order.status === 'new' && declining && (
          <div className="decline-box">
            <p className="small">Why are you declining this order?</p>
            <div className="decline-reasons">
              {DECLINE_REASONS.map((reason) => (
                <button key={reason} type="button" className="chip" onClick={() => declineOrder(order.id, reason)}>
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
          <button type="button" className="btn btn-primary" onClick={() => markReady(order.id)}>
            Mark ready for pickup
          </button>
        )}
        {order.status === 'ready' && (
          <button type="button" className="btn btn-pili" onClick={() => markPickedUp(order.id)}>
            Handed to rider
          </button>
        )}
      </div>
    </article>
  );
}

export default function Orders() {
  const { orders, simulateOrder, store } = useMerchant();
  const [tab, setTab] = useState('new');
  const [, setTick] = useState(0);

  // Refresh the "5 min ago" labels every 30 seconds.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const visible = orders.filter((o) => o.status === tab);
  const countOf = (key) => orders.filter((o) => o.status === key).length;
  const currentTab = TABS.find((t) => t.key === tab);

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Orders</h1>
          <p className="muted">
            {store.isOpen
              ? 'New orders play a sound. Accept them quickly so a rider can be assigned.'
              : 'Your store is closed, so no new orders will come in.'}
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={simulateOrder}>
          Demo: simulate an order
        </button>
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
            {countOf(t.key) > 0 && <span className="tab-count">{countOf(t.key)}</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>{currentTab.empty}</p>
          <p className="muted small">Use "Demo: simulate an order" to see how orders work.</p>
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