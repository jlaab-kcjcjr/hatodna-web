import { Link } from 'react-router-dom';
import { useMerchant } from '../context/MerchantContext';
import { peso, isToday, greeting, timeAgo } from '../utils/format';

export default function Overview() {
  const { store, orders, products, toggleOpen } = useMerchant();

  const today = orders.filter((o) => isToday(o.createdAt) && o.status !== 'declined');
  const sales = today.reduce((sum, o) => sum + o.subtotal, 0);
  const waiting = orders.filter((o) => o.status === 'new');
  const soldOut = products.filter((p) => !p.available);
  const firstName = store.owner.split(' ')[0];

  const tally = {};
  today.forEach((o) =>
    o.items.forEach((i) => {
      tally[i.name] = (tally[i.name] || 0) + i.qty;
    })
  );
  const best = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="page">
      <header className="page-head">
        <p className="greet">
          {greeting()}, {firstName}
        </p>
        <h1>Here's your store today</h1>
      </header>

      {!store.isOpen && (
        <div className="banner banner-closed">
          <p>
            <strong>Your store is closed.</strong> Customers can see your menu but can't order.
          </p>
          <button className="btn btn-primary" type="button" onClick={toggleOpen}>
            Open store
          </button>
        </div>
      )}

      <div className="stats">
        <div className="stat stat-feature">
          <p className="stat-label">Sales today</p>
          <p className="stat-value">{peso(sales)}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Orders today</p>
          <p className="stat-value">{today.length}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Waiting for you</p>
          <p className="stat-value">{waiting.length}</p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>New orders</h2>
            <Link to="/merchant/orders" className="link">
              See all orders
            </Link>
          </div>
          {waiting.length === 0 ? (
            <p className="muted">No orders waiting. New ones appear here with a sound alert.</p>
          ) : (
            waiting.slice(0, 3).map((o) => (
              <Link key={o.id} to="/merchant/orders" className="mini-order">
                <div>
                  <strong>{o.code}</strong> <span className="muted">{o.customer}</span>
                  <p className="muted small">
                    {o.items.reduce((sum, i) => sum + i.qty, 0)} items, {timeAgo(o.createdAt)}
                  </p>
                </div>
                <span className="mini-total">{peso(o.subtotal)}</span>
              </Link>
            ))
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Best sellers today</h2>
          </div>
          {best.length === 0 ? (
            <p className="muted">Your top items will show here once orders come in.</p>
          ) : (
            <ol className="best">
              {best.map(([name, qty]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span className="muted">{qty} sold</span>
                </li>
              ))}
            </ol>
          )}
          {soldOut.length > 0 && (
            <p className="note">
              {soldOut.length} {soldOut.length === 1 ? 'item is' : 'items are'} marked sold out.{' '}
              <Link to="/merchant/products" className="link">
                Review products
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}