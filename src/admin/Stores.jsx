import { useState } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL, PERMITS } from '../data/adminData';
import { ago } from '../utils/adminUtils';

const TABS = [
  { key: 'pending', label: 'Applications' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
];

function StoreReview({ store, onClose }) {
  const { settings, setStoreStatus, setStoreCommission } = useAdmin();
  const [commission, setCommission] = useState(String(store.commissionPercent ?? settings.defaultCommissionPercent));
  const [mode, setMode] = useState(null); // 'reject' or 'suspend'
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const missingPermits = PERMITS.filter((p) => p.required && !store.permits.includes(p.key));
  const commissionValue = Number(commission);
  const commissionValid = commission !== '' && commissionValue >= 0 && commissionValue <= 40;

  const close = () => onClose();

  const approve = () => {
    if (!commissionValid) {
      setError('Set a commission between 0% and 40%.');
      return;
    }
    setStoreStatus(store.id, 'active', '', { commissionPercent: commissionValue });
    close();
  };

  const saveCommission = () => {
    if (!commissionValid) {
      setError('Set a commission between 0% and 40%.');
      return;
    }
    setStoreCommission(store.id, commissionValue);
    setError('');
    setSaved(true);
  };

  const confirmReason = () => {
    if (reason.trim().length < 5) {
      setError('Write a short reason. The store owner will see it.');
      return;
    }
    setStoreStatus(store.id, mode === 'reject' ? 'rejected' : 'suspended', reason.trim());
    close();
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="store-review-title">{store.name}</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <span className={`status status-${store.status}`}>{STATUS_LABEL[store.status]}</span>
        {(store.status === 'suspended' || store.status === 'rejected') && store.note && (
          <p className="note-box">Reason: {store.note}</p>
        )}

        <dl className="detail-list">
          <dt>Owner</dt>
          <dd>{store.owner}</dd>
          <dt>Contact</dt>
          <dd>{store.phone}</dd>
          <dt>Category</dt>
          <dd>{store.category}</dd>
          <dt>Address</dt>
          <dd>{store.address}</dd>
          <dt>Applied</dt>
          <dd>{ago(store.appliedAt)}</dd>
        </dl>

        <h3 className="modal-section">Permits</h3>
        <div className="doc-grid">
          {PERMITS.map((p) => {
            const has = store.permits.includes(p.key);
            return (
              <div key={p.key} className={`doc-tile${has ? '' : ' missing'}`}>
                <FileText size={22} aria-hidden="true" />
                <span>{p.label}</span>
                <span className="small">
                  {has ? 'Submitted' : p.required ? 'Missing (required)' : 'Not submitted'}
                </span>
              </div>
            );
          })}
        </div>

        {store.status !== 'rejected' && (
          <label className="field commission-field">
            <span>Commission on each order (%)</span>
            <input
              type="number"
              min="0"
              max="40"
              value={commission}
              onChange={(e) => {
                setCommission(e.target.value);
                setError('');
                setSaved(false);
              }}
            />
          </label>
        )}

        {mode ? (
          <div className="reason-box">
            <label className="field">
              <span>{mode === 'reject' ? 'Reason for rejecting' : 'Reason for suspending'}</span>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder={
                  mode === 'reject'
                    ? "e.g. Please submit your Mayor's permit so we can approve you."
                    : 'e.g. Repeated late order preparation.'
                }
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setMode(null);
                  setError('');
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmReason}>
                {mode === 'reject' ? 'Reject application' : 'Suspend store'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {store.status === 'pending' && missingPermits.length > 0 && (
              <p className="note-box">
                Missing: {missingPermits.map((p) => p.label).join(', ')}. Ask the owner to submit it before approving.
              </p>
            )}
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              {store.status === 'pending' && (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => setMode('reject')}>
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-pili"
                    disabled={missingPermits.length > 0}
                    onClick={approve}
                  >
                    Approve store
                  </button>
                </>
              )}
              {store.status === 'active' && (
                <>
                  <button type="button" className="btn btn-ghost danger-text" onClick={() => setMode('suspend')}>
                    Suspend store
                  </button>
                  <button type="button" className={`btn ${saved ? 'btn-pili' : 'btn-primary'}`} onClick={saveCommission}>
                    {saved ? 'Saved' : 'Save commission'}
                  </button>
                </>
              )}
              {store.status === 'suspended' && (
                <button
                  type="button"
                  className="btn btn-pili"
                  onClick={() => {
                    setStoreStatus(store.id, 'active');
                    close();
                  }}
                >
                  Reinstate store
                </button>
              )}
              {store.status === 'rejected' && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setStoreStatus(store.id, 'pending');
                    close();
                  }}
                >
                  Move back to applications
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Stores() {
  const { stores } = useAdmin();
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [reviewId, setReviewId] = useState(null);

  const countOf = (key) => stores.filter((s) => s.status === key).length;
  const visible = stores.filter(
    (s) => s.status === tab && `${s.name} ${s.owner} ${s.town}`.toLowerCase().includes(query.toLowerCase())
  );
  const reviewing = stores.find((s) => s.id === reviewId);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Stores</h1>
        <p className="muted">Approve new partners and set the commission each store pays.</p>
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

      <div className="toolbar">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by store, owner, or town"
            aria-label="Search stores"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>No stores here.</p>
          <p className="muted small">Stores move between these tabs as you review them.</p>
        </div>
      ) : (
        <div className="person-grid">
          {visible.map((s) => (
            <article key={s.id} className="person">
              <div className="person-head">
                <p className="person-name">{s.name}</p>
                <span className={`status status-${s.status}`}>{STATUS_LABEL[s.status]}</span>
              </div>
              <p className="muted small">
                {s.category} in {s.town}, owned by {s.owner}
              </p>
              <p className="muted small">
                {s.status === 'pending'
                  ? `Applied ${ago(s.appliedAt)}`
                  : s.status === 'active'
                    ? `Commission: ${s.commissionPercent}%`
                    : s.note}
              </p>
              <button type="button" className="btn btn-outline person-btn" onClick={() => setReviewId(s.id)}>
                {s.status === 'pending' ? 'Review application' : 'View details'}
              </button>
            </article>
          ))}
        </div>
      )}

      {reviewing && <StoreReview key={reviewing.id} store={reviewing} onClose={() => setReviewId(null)} />}
    </div>
  );
}