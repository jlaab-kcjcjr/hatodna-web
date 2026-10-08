import { useState } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL, DOC_LABELS, requiredDocsFor } from '../data/adminData';
import { ago } from '../utils/adminUtils';

const TABS = [
  { key: 'pending', label: 'Applications' },
  { key: 'approved', label: 'Approved' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
];

function RiderReview({ rider, onClose }) {
  const { setRiderStatus } = useAdmin();
  const [mode, setMode] = useState(null); // 'reject' or 'suspend'
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const required = requiredDocsFor(rider.vehicle);
  const missingDocs = required.filter((k) => !rider.docs.includes(k));

  const act = (status, note = '') => {
    setRiderStatus(rider.id, status, note);
    onClose();
  };

  const confirmReason = () => {
    if (reason.trim().length < 5) {
      setError('Write a short reason. The rider will see it.');
      return;
    }
    act(mode === 'reject' ? 'rejected' : 'suspended', reason.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rider-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="rider-review-title">{rider.name}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <span className={`status status-${rider.status}`}>{STATUS_LABEL[rider.status]}</span>
        {(rider.status === 'suspended' || rider.status === 'rejected') && rider.note && (
          <p className="note-box">Reason: {rider.note}</p>
        )}

        <dl className="detail-list">
          <dt>Mobile</dt>
          <dd>{rider.phone}</dd>
          <dt>Service area</dt>
          <dd>{rider.town}</dd>
          <dt>Vehicle</dt>
          <dd>
            {rider.vehicle}
            {rider.plate ? `, ${rider.plate}` : ''}
          </dd>
          <dt>Applied</dt>
          <dd>{ago(rider.appliedAt)}</dd>
          {rider.status !== 'pending' && (
            <>
              <dt>Deliveries</dt>
              <dd>{rider.deliveries}</dd>
              <dt>Rating</dt>
              <dd>{rider.rating ?? 'No ratings yet'}</dd>
            </>
          )}
        </dl>

        <h3 className="modal-section">Documents</h3>
        <div className="doc-grid">
          {required.map((k) => {
            const has = rider.docs.includes(k);
            return (
              <div key={k} className={`doc-tile${has ? '' : ' missing'}`}>
                <FileText size={22} aria-hidden="true" />
                <span>{DOC_LABELS[k]}</span>
                <span className="small">{has ? 'Submitted' : 'Missing'}</span>
              </div>
            );
          })}
        </div>
        <p className="muted small">In the live system, you'll tap a document to see the photo the rider uploaded.</p>

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
                    ? 'e.g. OR/CR photo is blurry. Please upload a clearer copy.'
                    : 'e.g. Unremitted COD cash for 5 days.'
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
                {mode === 'reject' ? 'Reject application' : 'Suspend rider'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {rider.status === 'pending' && missingDocs.length > 0 && (
              <p className="note-box">
                Missing: {missingDocs.map((k) => DOC_LABELS[k]).join(', ')}. Ask the rider to upload it before approving.
              </p>
            )}
            <div className="modal-actions">
              {rider.status === 'pending' && (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => setMode('reject')}>
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-pili"
                    disabled={missingDocs.length > 0}
                    onClick={() => act('approved')}
                  >
                    Approve rider
                  </button>
                </>
              )}
              {rider.status === 'approved' && (
                <button type="button" className="btn btn-ghost danger-text" onClick={() => setMode('suspend')}>
                  Suspend rider
                </button>
              )}
              {rider.status === 'suspended' && (
                <button type="button" className="btn btn-pili" onClick={() => act('approved')}>
                  Reinstate rider
                </button>
              )}
              {rider.status === 'rejected' && (
                <button type="button" className="btn btn-ghost" onClick={() => act('pending')}>
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

export default function Riders() {
  const { riders } = useAdmin();
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [reviewId, setReviewId] = useState(null);

  const countOf = (key) => riders.filter((r) => r.status === key).length;
  const visible = riders.filter(
    (r) => r.status === tab && `${r.name} ${r.town} ${r.phone}`.toLowerCase().includes(query.toLowerCase())
  );
  const reviewing = riders.find((r) => r.id === reviewId);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Riders</h1>
        <p className="muted">Review applications, then approve, suspend, or reinstate riders.</p>
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
            placeholder="Search by name, town, or number"
            aria-label="Search riders"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>No riders here.</p>
          <p className="muted small">Riders move between these tabs as you review them.</p>
        </div>
      ) : (
        <div className="person-grid">
          {visible.map((r) => (
            <article key={r.id} className="person">
              <div className="person-head">
                <p className="person-name">{r.name}</p>
                <span className={`status status-${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              <p className="muted small">
                {r.vehicle}
                {r.plate ? `, ${r.plate}` : ''} in {r.town}
              </p>
              <p className="muted small">
                {r.status === 'pending'
                  ? `Applied ${ago(r.appliedAt)}`
                  : r.status === 'approved'
                    ? `${r.deliveries} deliveries, ${r.rating ?? 'no'} rating`
                    : r.note}
              </p>
              <button type="button" className="btn btn-outline person-btn" onClick={() => setReviewId(r.id)}>
                {r.status === 'pending' ? 'Review application' : 'View details'}
              </button>
            </article>
          ))}
        </div>
      )}

      {reviewing && <RiderReview rider={reviewing} onClose={() => setReviewId(null)} />}
    </div>
  );
}