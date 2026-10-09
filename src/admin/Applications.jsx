import { useState } from 'react';
import { Phone } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL } from '../data/adminData';
import { ago } from '../utils/adminUtils';

const TABS = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function ApplicationCard({ app }) {
  const { setApplicationStatus } = useAdmin();
  const [busy, setBusy] = useState(false);

  const move = async (status) => {
    setBusy(true);
    try {
      await setApplicationStatus(app.id, status);
    } catch (err) {
      window.alert(err.message);
      setBusy(false);
    }
  };

  return (
    <article className="person">
      <div className="person-head">
        <p className="person-name">{app.store_name}</p>
        <span className={`status status-${app.status}`}>{STATUS_LABEL[app.status]}</span>
      </div>
      <p className="muted small">
        {app.category} in {app.town}, owner {app.owner_name}
      </p>
      <p className="muted small">Applied {ago(app.created_at)}</p>
      {app.message && <p className="order-note">{app.message}</p>}
      <a className="btn btn-outline person-btn" href={`tel:${app.phone}`}>
        <Phone size={16} aria-hidden="true" />
        Call {app.phone}
      </a>
      <div className="app-actions">
        {app.status === 'new' && (
          <>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => move('rejected')}>
              Reject
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => move('contacted')}>
              Mark contacted
            </button>
          </>
        )}
        {app.status === 'contacted' && (
          <>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => move('rejected')}>
              Reject
            </button>
            <button type="button" className="btn btn-pili" disabled={busy} onClick={() => move('approved')}>
              Mark approved
            </button>
          </>
        )}
        {(app.status === 'approved' || app.status === 'rejected') && (
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => move('new')}>
            Move back to new
          </button>
        )}
      </div>
    </article>
  );
}

export default function Applications() {
  const { applications } = useAdmin();
  const [tab, setTab] = useState('new');

  const countOf = (key) => applications.filter((a) => a.status === key).length;
  const visible = applications.filter((a) => a.status === tab);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Partner applications</h1>
        <p className="muted">
          Stores that applied through the landing page. Call them, then mark your progress here. To go live, the owner
          creates a partner account and registers the store, which you approve under Stores.
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
            {countOf(t.key) > 0 && <span className="tab-count">{countOf(t.key)}</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>No applications here.</p>
          <p className="muted small">New applications from the landing page form appear in this list.</p>
        </div>
      ) : (
        <div className="person-grid">
          {visible.map((a) => (
            <ApplicationCard key={a.id} app={a} />
          ))}
        </div>
      )}
    </div>
  );
}