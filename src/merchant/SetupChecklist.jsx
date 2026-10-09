import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Circle } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import { PERMITS } from '../data/adminData';
import { LINKS } from '../config/links';

// Home screen for stores waiting for approval: finish setting up while the team reviews.
export default function SetupChecklist() {
  const { store, products, hours, permits, resubmitStore } = useMerchant();
  const [busy, setBusy] = useState(false);
  const [resubmitError, setResubmitError] = useState('');
  const rejected = store.status === 'rejected';
  const permitsDone = PERMITS.filter((p) => p.required).every((p) => permits.some((x) => x.permit_type === p.key));
  const pinned = store.lat != null;

  const items = [
    {
      done: true,
      title: 'Business details submitted',
      text: `${store.name}, ${store.address}`,
      to: '/merchant/settings',
      action: 'Edit details',
    },
    {
      done: pinned,
      title: 'Store location pinned',
      text: pinned ? 'Riders know where to pick up your orders.' : 'Pin your entrance so riders can find you.',
      to: '/merchant/settings',
      action: pinned ? 'Move pin' : 'Pin location',
    },
    {
      done: permitsDone,
      title: 'Required permits uploaded',
      text: permitsDone
        ? "DTI or SEC registration and Mayor's permit received."
        : "Upload your DTI or SEC registration and Mayor's permit.",
      to: '/merchant/settings',
      action: permitsDone ? 'View permits' : 'Upload permits',
    },
    {
      done: products.length > 0,
      title: 'Menu added',
      text:
        products.length > 0
          ? `${products.length} ${products.length === 1 ? 'product' : 'products'} ready.`
          : 'Add your products with prices and photos.',
      to: '/merchant/products',
      action: products.length > 0 ? 'Edit menu' : 'Add products',
    },
    {
      done: hours.length > 0,
      title: 'Opening hours set',
      text: 'Customers see when you are open.',
      to: '/merchant/settings',
      action: 'Edit hours',
    },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const readyToResubmit = pinned && permitsDone;

  const onResubmit = async () => {
    setBusy(true);
    setResubmitError('');
    try {
      await resubmitStore();
    } catch (err) {
      setResubmitError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <p className="greet">{rejected ? 'Needs changes' : 'Under review'}</p>
        <h1>Set up your store</h1>
      </header>

      <div className={`banner ${rejected ? 'banner-closed' : 'banner-info'}`}>
        <p>
          {rejected ? (
            <>
              <strong>We couldn't approve your store yet.</strong>{' '}
              {store.status_note || 'Please contact us so we can help you complete your application.'}
            </>
          ) : (
            <>
              <strong>Your store is being reviewed.</strong> Finish your setup while you wait. Your store goes live for
              customers as soon as we approve it.
            </>
          )}
        </p>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Setup checklist</h2>
          <span className="muted">
            {doneCount} of {items.length} done
          </span>
        </div>
        <div className="setup-progress" aria-hidden="true">
          <span style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
        <ul className="checklist">
          {items.map((item) => (
            <li key={item.title} className={`check-item${item.done ? ' done' : ''}`}>
              {item.done ? <CircleCheck size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}
              <div className="check-text">
                <p className="check-title">
                  {item.title}
                  <span className="sr-only">{item.done ? ' (done)' : ' (not done)'}</span>
                </p>
                <p className="muted small">{item.text}</p>
              </div>
              <Link to={item.to} className="btn btn-outline btn-small">
                {item.action}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {rejected && (
        <section className="card resubmit-card">
          <h2>Ready for another review?</h2>
          <p className="muted setup-text">
            Fix what our team asked for above (your details, location, and permits are in Store settings), then send your
            store back to us. We'll review it again within 1 to 2 days.
          </p>
          {!readyToResubmit && (
            <p className="note-box">Pin your location and upload the required permits first, then you can resubmit.</p>
          )}
          {resubmitError && <p className="form-error">{resubmitError}</p>}
          <button type="button" className="btn btn-primary" disabled={busy || !readyToResubmit} onClick={onResubmit}>
            {busy ? 'Sending...' : 'Resubmit for review'}
          </button>
        </section>
      )}

      <p className="muted small setup-contact">
        Questions about your review? Email{' '}
        <a className="link" href={`mailto:${LINKS.email}`}>
          {LINKS.email}
        </a>
      </p>
    </div>
  );
}