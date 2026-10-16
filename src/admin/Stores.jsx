import { useEffect, useState } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { STATUS_LABEL, PERMITS } from '../data/adminData';
import { ago } from '../utils/adminUtils';
import { parseQrPh } from '../utils/qrph';
import { supabase } from '../lib/supabase';

const SCHEDULE_LABEL = { daily: 'Daily', weekly: 'Weekly (Mondays)', twice_monthly: 'Twice a month (15th and month-end)' };

const TABS = [
  { key: 'pending', label: 'Registrations' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
];

function StoreReview({ store, onClose }) {
  const { settings, setStoreStatus, setStoreCommission, getFileUrls } = useAdmin();
  const [commission, setCommission] = useState(
    String(store.commission_percent ?? settings?.default_commission_percent ?? 15)
  );
  const [mode, setMode] = useState(null); // 'reject' or 'suspend'
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [urls, setUrls] = useState({});
  const [ratings, setRatings] = useState({ storeId: null, summary: null, reviews: [] });

  const permits = store.store_permits ?? [];
  const payout = Array.isArray(store.store_payouts) ? store.store_payouts[0] : store.store_payouts;
  const qrInfo = payout?.qr_payload ? parseQrPh(payout.qr_payload) : null;
  const payoutComplete = Boolean(payout?.qr_payload);
  const commissionValue = Number(commission);
  const commissionValid = commission !== '' && commissionValue >= 0 && commissionValue <= 40;

  useEffect(() => {
    let cancelled = false;
    getFileUrls('store-permits', permits.map((p) => ({ key: p.permit_type, path: p.file_path }))).then((result) => {
      if (!cancelled) setUrls(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id]);

    // Customer ratings for this store (average and latest reviews with order codes).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.rpc('store_rating_summaries'),
      supabase.rpc('store_reviews_list', { p_store_id: store.id, p_limit: 10 }),
    ]).then(([all, list]) => {
      if (cancelled) return;
      setRatings({
        storeId: store.id,
        summary: (all.data ?? []).find((r) => r.store_id === store.id) ?? null,
        reviews: list.data ?? [],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [store.id]);
  const ratingTotal = ratings.storeId === store.id ? Number(ratings.summary?.total ?? 0) : 0;

  const run = async (task, closeAfter = true) => {
    setBusy(true);
    setError('');
    try {
      await task();
      if (closeAfter) onClose();
      else setBusy(false);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const approve = () => {
    if (!commissionValid) return setError('Set a commission between 0% and 40%.');
    run(() => setStoreStatus(store.id, 'active', '', { commission_percent: commissionValue }));
  };

  const saveCommission = () => {
    if (!commissionValid) return setError('Set a commission between 0% and 40%.');
    run(async () => {
      await setStoreCommission(store.id, commissionValue);
      setSaved(true);
    }, false);
  };

  const confirmReason = () => {
    if (reason.trim().length < 5) return setError('Write a short reason. The store owner will see it.');
    run(() => setStoreStatus(store.id, mode === 'reject' ? 'rejected' : 'suspended', reason.trim()));
  };

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="store-review-title">{store.name}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" disabled={busy}>
            <X size={20} />
          </button>
        </div>

        <span className={`status status-${store.status}`}>{STATUS_LABEL[store.status]}</span>
        {(store.status === 'suspended' || store.status === 'rejected') && store.status_note && (
          <p className="note-box">Reason: {store.status_note}</p>
        )}

        {store.status === 'pending' && store.resubmitted_at && (
          <p className="note-box resubmit-note">
            Resubmitted {ago(store.resubmitted_at)} after changes were requested.
            {store.last_rejection_note ? ` Previous reason: ${store.last_rejection_note}` : ''}
          </p>
        )}

        <dl className="detail-list">
          <dt>Owner</dt>
          <dd>{store.owner_name || 'Not provided'}</dd>
          <dt>Contact</dt>
          <dd>
            {store.phone ? (
              <a className="link" href={`tel:${store.phone}`}>
                {store.phone}
              </a>
            ) : (
              'Not provided'
            )}
          </dd>
          <dt>Category</dt>
          <dd>{store.category}</dd>
          <dt>Address</dt>
          <dd>
            {store.address}, {store.town}
          </dd>
          <dt>Registered</dt>
          <dd>{ago(store.created_at)}</dd>
          <dt>Location</dt>
          <dd>
            {store.lat != null ? (
              <a
                className="link"
                href={`https://www.google.com/maps?q=${store.lat},${store.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Pinned, view on Google Maps
              </a>
            ) : (
              'Not pinned yet'
            )}
          </dd>

            <dt>Rating</dt>
            <dd>
              {ratingTotal > 0
                ? `★ ${Number(ratings.summary.average).toFixed(1)} from ${ratingTotal} ${ratingTotal === 1 ? 'rating' : 'ratings'}`
                : 'No ratings yet'}
            </dd>
          
          <dt>Menu</dt>
          <dd>
            {store.products?.[0]?.count ?? 0} {(store.products?.[0]?.count ?? 0) === 1 ? 'product' : 'products'}
          </dd>
        </dl>

        {store.status === 'pending' && (store.lat == null || !(store.products?.[0]?.count > 0)) && (
          <p className="note-box">
            Setup not finished:{' '}
            {[store.lat == null && 'location not pinned', !(store.products?.[0]?.count > 0) && 'no products yet']
              .filter(Boolean)
              .join(', ')}
            . You can still approve, but customers can't order until both are done.
          </p>
        )}

                  {ratingTotal > 0 && (
            <>
              <h3 className="modal-section">Latest customer reviews</h3>
              <ul className="review-list">
                {ratings.reviews.map((r, i) => (
                  <li key={`${r.order_code}-${i}`}>
                    <p>
                      <span className="review-stars">{'★'.repeat(r.stars)}</span>
                      <span className="review-off">{'★'.repeat(5 - r.stars)}</span>{' '}
                      <span className="muted small">
                        {r.order_code} · {r.reviewer} · {ago(r.created_at)}
                      </span>
                    </p>
                    {r.tags?.length > 0 && <p className="muted small">{r.tags.join(' · ')}</p>}
                    {r.comment && <p className="review-comment">“{r.comment}”</p>}
                  </li>
                ))}
              </ul>
            </>
          )}

        <h3 className="modal-section">Payout account</h3>
        {payout ? (
          <dl className="detail-list">
            <dt>Method</dt>
            <dd>{payout.method === 'maya' ? 'Maya' : 'GCash'}</dd>
            <dt>Account name</dt>
            <dd>{payout.account_name}</dd>
            <dt>Number</dt>
            <dd>{payout.account_number}</dd>
            <dt>Schedule</dt>
            <dd>{SCHEDULE_LABEL[payout.schedule] ?? payout.schedule}</dd>
            <dt>QR code</dt>
            <dd>
              {!payout.qr_payload
                ? 'Not uploaded'
                : qrInfo?.ok
                  ? `Read OK, account holder: ${qrInfo.name || 'not shown'}${qrInfo.provider ? ` (${qrInfo.provider === 'gcash' ? 'GCash' : 'Maya'})` : ''}`
                  : 'Saved, but could not be read'}
            </dd>
          </dl>
        ) : (
          <p className="note-box">No payout account yet. The merchant must add their GCash or Maya number and QR code.</p>
        )}
        {payout && qrInfo?.ok && qrInfo.name && (
          <p className="muted small">Check that the QR account holder matches the account name and the store owner.</p>
        )}

        <h3 className="modal-section">Permits</h3>
        <div className="doc-grid">
          {PERMITS.map((p) => {
            const permit = permits.find((x) => x.permit_type === p.key);
            const url = urls[p.key];
            if (!permit) {
              return (
                <div key={p.key} className={`doc-tile${p.required ? ' missing' : ''}`}>
                  <FileText size={22} aria-hidden="true" />
                  <span>{p.label}</span>
                  <span className="small">{p.required ? 'Not uploaded (required)' : 'Not uploaded'}</span>
                </div>
              );
            }
            const isPdf = permit.file_path.endsWith('.pdf');
            return (
              <a key={p.key} className="doc-tile doc-tile-photo" href={url || undefined} target="_blank" rel="noreferrer">
                {url && !isPdf ? <img src={url} alt={p.label} /> : <FileText size={26} aria-hidden="true" />}
                <span className="doc-caption">
                  {p.label}
                  {isPdf ? ' (PDF)' : ''}
                </span>
              </a>
            );
          })}
        </div>

        <p className="muted small">Tap a permit to open the full file. Links expire after 1 hour.</p>

        {store.status !== 'rejected' && (
          <label className="field commission-field">
            <span>Commission on each order (%)</span>
            <input
              type="number"
              min="0"
              max="40"
              step="0.5"
              value={commission}
              onChange={(e) => {
                setCommission(e.target.value);
                setError('');
                setSaved(false);
              }}
            />
          </label>
        )}

        {(store.status === 'pending' || store.status === 'suspended') && !payoutComplete && (
          <p className="note-box">Approval is locked until the merchant adds a payout account and QR code.</p>
        )}

        {error && <p className="form-error">{error}</p>}

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
                    ? "e.g. Please send a copy of your Mayor's permit so we can approve you."
                    : 'e.g. Repeated late order preparation.'
                }
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setMode(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={confirmReason}>
                {mode === 'reject' ? 'Reject registration' : 'Suspend store'}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-actions">
            {store.status === 'pending' && (
              <>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setMode('reject')}>
                  Reject
                </button>
                <button type="button" className="btn btn-pili" disabled={busy || !payoutComplete} onClick={approve}>
                  Approve store
                </button>
              </>
            )}
            {store.status === 'active' && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost danger-text"
                  disabled={busy}
                  onClick={() => setMode('suspend')}
                >
                  Suspend store
                </button>
                <button
                  type="button"
                  className={`btn ${saved ? 'btn-pili' : 'btn-primary'}`}
                  disabled={busy}
                  onClick={saveCommission}
                >
                  {saved ? 'Saved' : 'Save commission'}
                </button>
              </>
            )}
            {store.status === 'suspended' && (
              <button
                type="button"
                className="btn btn-pili"
                disabled={busy || !payoutComplete}
                onClick={() => run(() => setStoreStatus(store.id, 'active'))}
              >
                Reinstate store
              </button>
            )}
            {store.status === 'rejected' && (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => run(() => setStoreStatus(store.id, 'pending'))}
              >
                Move back to registrations
              </button>
            )}
          </div>
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
    (s) => s.status === tab && `${s.name} ${s.owner_name} ${s.town}`.toLowerCase().includes(query.toLowerCase())
  );
  const reviewing = stores.find((s) => s.id === reviewId);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Stores</h1>
        <p className="muted">Approve store registrations and set the commission each store pays.</p>
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
          <p className="muted small">Stores registered in the partner portal appear in this list.</p>
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
                {s.category} in {s.town}
                {s.owner_name ? `, owned by ${s.owner_name}` : ''}
              </p>
              <p className="muted small">
                {s.status === 'pending'
                  ? s.resubmitted_at
                    ? `Resubmitted ${ago(s.resubmitted_at)}`
                    : `Registered ${ago(s.created_at)}`
                  : s.status === 'active'
                    ? `Commission: ${s.commission_percent}%${s.is_open ? ', open now' : ', closed'}`
                    : s.status_note}
              </p>
              <button type="button" className="btn btn-outline person-btn" onClick={() => setReviewId(s.id)}>
                {s.status === 'pending' ? 'Review registration' : 'View details'}
              </button>
            </article>
          ))}
        </div>
      )}

      {reviewing && <StoreReview key={reviewing.id} store={reviewing} onClose={() => setReviewId(null)} />}
    </div>
  );
}