import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMerchant } from '../context/MerchantContext';
import { peso, isToday, greeting, timeAgo } from '../utils/format';

export default function Overview() {
  const { profile } = useAuth();
  const { store, orders, products, toggleOpen } = useMerchant();

  const counted = orders.filter((o) => o.status !== 'declined' && o.status !== 'cancelled');
  const today = counted.filter((o) => isToday(o.created_at));
  const sales = today.reduce((sum, o) => sum + Number(o.subtotal), 0);
  const earnings = today.reduce((sum, o) => sum + Number(o.subtotal) - Number(o.commission_amount), 0);
  const waiting = orders.filter((o) => o.status === 'placed');
  const soldOut = products.filter((p) => !p.is_available);
  const firstName = (profile?.full_name || store.owner_name || 'partner').split(' ')[0];

  const tally = {};
  today.forEach((o) =>
    (o.order_items ?? []).forEach((i) => {
      tally[i.name] = (tally[i.name] || 0) + i.qty;
    })
  );
  const best = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const onOpen = async () => {
    try {
      await toggleOpen();
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <p className="greet">
          {greeting()}, {firstName}
        </p>
        <h1>Here's your store today</h1>
      </header>

      {!store.is_open && (
        <div className="banner banner-closed">
          <p>
            <strong>Your store is closed.</strong> Customers can see your menu but can't order.
          </p>
          <button className="btn btn-primary" type="button" onClick={onOpen}>
            Open store
          </button>
        </div>
      )}

      {store.lat == null && (
        <div className="banner banner-closed">
          <p>
            <strong>Pin your store on the map.</strong> Customers can't order from you until your location is set.
          </p>
          <Link to="/merchant/settings" className="btn btn-primary">
            Set location
          </Link>
        </div>
      )}

      <div className="stats stats-4">
        <div className="stat stat-feature">
          <p className="stat-label">You earn today</p>
          <p className="stat-value">{peso(earnings)}</p>
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
            <p className="muted">No orders waiting. New ones appear here instantly with a sound.</p>
          ) : (
            waiting.slice(0, 3).map((o) => (
              <Link key={o.id} to="/merchant/orders" className="mini-order">
                <div>
                  <strong>{o.code}</strong> <span className="muted">{o.customer_name || 'Customer'}</span>
                  <p className="muted small">
                    {(o.order_items ?? []).reduce((sum, i) => sum + i.qty, 0)} items, {timeAgo(o.created_at)}
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