import { useEffect, useState } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL, DOC_LABELS, requiredDocsFor } from '../data/adminData';
import { ago, formatPhone } from '../utils/adminUtils';

const TABS = [
  { key: 'pending', label: 'Applications' },
  { key: 'orientation', label: 'Orientation' },
  { key: 'approved', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
];

// A starting point for the schedule. Edit it to your real orientation details before sending.
const DEFAULT_ORIENTATION =
  'Saturday, 9:00 AM to 11:00 AM\nHatodNa office, Legazpi City (exact address to follow)\nPlease arrive 10 minutes early.';

function RiderReview({ rider, deliveries, onClose }) {
  const { setRiderStatus, getFileUrls } = useAdmin();
  const [mode, setMode] = useState(null); // 'reject', 'suspend', or 'schedule'
  const [reason, setReason] = useState('');
  const [schedule, setSchedule] = useState(rider.orientation_note || DEFAULT_ORIENTATION);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState({});

  const docs = rider.rider_documents ?? [];
  const required = requiredDocsFor(rider.vehicle);
  const missingDocs = required.filter((k) => !docs.some((d) => d.doc_type === k));
  const name = rider.profile?.full_name || 'Unnamed rider';

  useEffect(() => {
    let cancelled = false;
    getFileUrls('rider-documents', docs.map((d) => ({ key: d.doc_type, path: d.file_path }))).then((result) => {
      if (!cancelled) setUrls(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider.id]);

  const act = async (status, note = '', extra = {}) => {
    setBusy(true);
    setError('');
    try {
      await setRiderStatus(rider.id, status, note, extra);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const confirmReason = () => {
    if (reason.trim().length < 5) {
      setError('Write a short reason. The rider will see it.');
      return;
    }
    act(mode === 'reject' ? 'rejected' : 'suspended', reason.trim());
  };

  const confirmSchedule = () => {
    if (schedule.trim().length < 10) {
      setError('Write the orientation date, time, and place. The rider will receive it by email.');
      return;
    }
    act('orientation', '', { orientation_note: schedule.trim() });
  };

  const cancelMode = () => {
    setMode(null);
    setError('');
  };

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rider-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="rider-review-title">{name}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" disabled={busy}>
            <X size={20} />
          </button>
        </div>

        <span className={`status status-${rider.status}`}>{STATUS_LABEL[rider.status]}</span>
        {(rider.status === 'suspended' || rider.status === 'rejected') && rider.status_note && (
          <p className="note-box">Reason: {rider.status_note}</p>
        )}
        {rider.status === 'orientation' && rider.orientation_note && (
          <p className="note-box orientation-box">
            <strong>Orientation schedule:</strong>
            <br />
            {rider.orientation_note}
          </p>
        )}

        <dl className="detail-list">
          <dt>Mobile</dt>
          <dd>{formatPhone(rider.profile?.phone)}</dd>
          <dt>Service area</dt>
          <dd>{rider.town}</dd>
          <dt>Vehicle</dt>
          <dd>
            {rider.vehicle}
            {rider.plate ? `, ${rider.plate}` : ''}
          </dd>
          <dt>Applied</dt>
          <dd>{ago(rider.created_at)}</dd>
          {rider.activated_at && (
            <>
              <dt>Activated</dt>
              <dd>{ago(rider.activated_at)}</dd>
            </>
          )}
          {rider.status === 'approved' && (
            <>
              <dt>Deliveries</dt>
              <dd>{deliveries}</dd>
              <dt>Rating</dt>
              <dd>{rider.rating ?? 'No ratings yet'}</dd>
            </>
          )}
        </dl>

        <h3 className="modal-section">Documents</h3>
        <div className="doc-grid">
          {required.map((k) => {
            const doc = docs.find((d) => d.doc_type === k);
            const url = urls[k];
            if (!doc) {
              return (
                <div key={k} className="doc-tile missing">
                  <FileText size={22} aria-hidden="true" />
                  <span>{DOC_LABELS[k]}</span>
                  <span className="small">Missing</span>
                </div>
              );
            }
            return (
              <a key={k} className="doc-tile doc-tile-photo" href={url || undefined} target="_blank" rel="noreferrer">
                {url ? <img src={url} alt={DOC_LABELS[k]} /> : <FileText size={22} aria-hidden="true" />}
                <span className="doc-caption">{DOC_LABELS[k]}</span>
              </a>
            );
          })}
        </div>
        <p className="muted small">Tap a document to open the full photo. Links expire after 1 hour.</p>

        {error && <p className="form-error">{error}</p>}

        {mode === 'reject' || mode === 'suspend' ? (
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
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={cancelMode}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={confirmReason}>
                {mode === 'reject' ? 'Reject' : 'Suspend rider'}
              </button>
            </div>
          </div>
        ) : mode === 'schedule' ? (
          <div className="reason-box">
            <label className="field">
              <span>Orientation schedule (sent to the rider by email)</span>
              <textarea
                rows={4}
                value={schedule}
                onChange={(e) => {
                  setSchedule(e.target.value);
                  setError('');
                }}
              />
            </label>
            <p className="muted small">
              The rider can't go online until you mark the orientation as done.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={cancelMode}>
                Cancel
              </button>
              <button type="button" className="btn btn-pili" disabled={busy} onClick={confirmSchedule}>
                {rider.status === 'orientation' ? 'Save and email new schedule' : 'Approve and schedule orientation'}
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
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setMode('reject')}>
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-pili"
                    disabled={busy || missingDocs.length > 0}
                    onClick={() => setMode('schedule')}
                  >
                    Approve
                  </button>
                </>
              )}
              {rider.status === 'orientation' && (
                <>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setMode('reject')}>
                    Reject
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setMode('schedule')}>
                    Reschedule
                  </button>
                  <button
                    type="button"
                    className="btn btn-pili"
                    disabled={busy}
                    onClick={() => act('approved', '', { activated_at: new Date().toISOString() })}
                  >
                    Mark orientation done and activate
                  </button>
                </>
              )}
              {rider.status === 'approved' && (
                <button
                  type="button"
                  className="btn btn-ghost danger-text"
                  disabled={busy}
                  onClick={() => setMode('suspend')}
                >
                  Suspend rider
                </button>
              )}
              {rider.status === 'suspended' && (
                <button type="button" className="btn btn-pili" disabled={busy} onClick={() => act('approved')}>
                  Reinstate rider
                </button>
              )}
              {rider.status === 'rejected' && (
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => act('pending')}>
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
  const { riders, orders } = useAdmin();
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [reviewId, setReviewId] = useState(null);

  const deliveriesOf = (id) => orders.filter((o) => o.rider_id === id && o.status === 'delivered').length;
  const countOf = (key) => riders.filter((r) => r.status === key).length;
  const visible = riders.filter(
    (r) =>
      r.status === tab &&
      `${r.profile?.full_name ?? ''} ${r.town} ${r.profile?.phone ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );
  const reviewing = riders.find((r) => r.id === reviewId);

  const cardLine = (r) => {
    if (r.status === 'pending') return `Applied ${ago(r.created_at)}`;
    if (r.status === 'orientation') return `Orientation: ${r.orientation_note.split('\n')[0]}`;
    if (r.status === 'approved') return `${deliveriesOf(r.id)} deliveries${r.is_online ? ', online now' : ''}`;
    return r.status_note;
  };

  const buttonLabel = (r) => {
    if (r.status === 'pending') return 'Review application';
    if (r.status === 'orientation') return 'Manage orientation';
    return 'View details';
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Riders</h1>
        <p className="muted">Review applications, schedule orientations, and activate riders.</p>
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
          <p className="muted small">Riders move between these tabs as you review and activate them.</p>
        </div>
      ) : (
        <div className="person-grid">
          {visible.map((r) => (
            <article key={r.id} className="person">
              <div className="person-head">
                <p className="person-name">{r.profile?.full_name || 'Unnamed rider'}</p>
                <span className={`status status-${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              <p className="muted small">
                {r.vehicle}
                {r.plate ? `, ${r.plate}` : ''} in {r.town}
              </p>
              <p className="muted small">{cardLine(r)}</p>
              <button type="button" className="btn btn-outline person-btn" onClick={() => setReviewId(r.id)}>
                {buttonLabel(r)}
              </button>
            </article>
          ))}
        </div>
      )}

      {reviewing && (
        <RiderReview
          key={reviewing.id}
          rider={reviewing}
          deliveries={deliveriesOf(reviewing.id)}
          onClose={() => setReviewId(null)}
        />
      )}
    </div>
  );
}