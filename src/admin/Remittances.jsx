import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import CashHeld from './CashHeld';

const peso = (n) =>
  `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

const TABS = [
  { key: 'verify', label: 'To verify', match: (s) => s === 'submitted' || s === 'awaiting_cash' },
  { key: 'short', label: 'Shortages', match: (s) => s === 'short' },
  { key: 'done', label: 'Settled', match: (s) => s === 'settled' || s === 'resolved' },
];

const STATUS = {
  awaiting_cash: { label: 'Rider on the way', tone: 'wait' },
  submitted: { label: 'Proof submitted', tone: 'wait' },
  short: { label: 'Cash shortage', tone: 'bad' },
  settled: { label: 'Settled', tone: 'good' },
  resolved: { label: 'Shortage resolved', tone: 'good' },
};

const RESOLUTIONS = [
  { key: 'rider_paid', label: 'Rider paid the shortage' },
  { key: 'deduct_earnings', label: 'Deduct from rider earnings' },
  { key: 'waived', label: 'Waived (valid reason)' },
  { key: 'other', label: 'Other (explain in note)' },
];

function RemittanceCard({ r }) {
  const { verifyRemittance, resolveShortage, getRemittanceOrders, getFileUrls } = useAdmin();
  const [proofUrl, setProofUrl] = useState('');
  const [orders, setOrders] = useState(null);
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = STATUS[r.status] ?? { label: r.status, tone: 'wait' };
  const name = r.rider?.profile?.full_name || 'Rider';
  const expected = Number(r.expected_amount);
  const countedNum = counted.trim() === '' ? NaN : Number(counted);
  const countedValid = Number.isFinite(countedNum) && countedNum >= 0;
  const diff = countedValid ? Math.round((countedNum - expected) * 100) / 100 : 0;

  const run = async (task) => {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const showProof = () =>
    run(async () => {
      const urls = await getFileUrls('remittance-proofs', [{ key: 'proof', path: r.proof_path }]);
      if (!urls.proof) throw new Error('Could not open the proof photo.');
      setProofUrl(urls.proof);
    });

  const toggleOrders = () => {
    if (orders) {
      setOrders(null);
      return;
    }
    run(async () => setOrders(await getRemittanceOrders(r.id)));
  };

  const onVerify = () => {
    if (!countedValid) {
      setError('Enter the cash you counted.');
      return;
    }
    run(async () => {
      await verifyRemittance(r.id, countedNum, note.trim());
      setCounted('');
      setNote('');
    });
  };

  const onResolve = () => {
    if (!resolution) {
      setError('Choose a resolution.');
      return;
    }
    if (resolution === 'other' && note.trim().length < 3) {
      setError('Explain the resolution in the note.');
      return;
    }
    run(async () => {
      await resolveShortage(r.id, resolution, note.trim());
      setNote('');
    });
  };

  return (
    <section className="card rm-card">
      <div className="rm-head">
        <div>
          <h2 className="rm-name">{name}</h2>
          <p className="muted small">
            {r.rider?.town} {r.rider?.profile?.phone ? `· ${r.rider.profile.phone}` : ''} · Shift ended {when(r.created_at)}
          </p>
        </div>
        <span className={`rm-chip rm-${status.tone}`}>{status.label}</span>
      </div>

      <dl className="rm-rows">
        <div>
          <dt>Cash collected ({r.order_count} {r.order_count === 1 ? 'delivery' : 'deliveries'})</dt>
          <dd>{peso(r.cash_collected)}</dd>
        </div>
        <div>
          <dt>Rider earnings (kept)</dt>
          <dd>− {peso(r.rider_earnings)}</dd>
        </div>
        <div className="rm-strong">
          <dt>Expected remittance</dt>
          <dd>{peso(expected)}</dd>
        </div>
        {r.counted_amount != null && (
          <div>
            <dt>Cash counted</dt>
            <dd>{peso(r.counted_amount)}</dd>
          </div>
        )}
        {Number(r.shortage_amount) > 0 && (
          <div className="rm-bad-row">
            <dt>Shortage</dt>
            <dd>{peso(r.shortage_amount)}</dd>
          </div>
        )}
      </dl>

      {r.rider_note && <p className="note-box">Rider's note: {r.rider_note}</p>}
      {r.submitted_at && <p className="muted small">Proof submitted {when(r.submitted_at)}</p>}

      <div className="rm-links">
        {r.proof_path &&
          (proofUrl ? (
            <a className="link" href={proofUrl} target="_blank" rel="noreferrer">
              Open proof of remittance
            </a>
          ) : (
            <button type="button" className="btn btn-outline btn-small" disabled={busy} onClick={showProof}>
              View proof
            </button>
          ))}
        <button type="button" className="btn btn-outline btn-small" disabled={busy} onClick={toggleOrders}>
          {orders ? 'Hide COD records' : 'View COD records'}
        </button>
      </div>
      {proofUrl && <img className="rm-proof" src={proofUrl} alt={`Proof of remittance from ${name}`} />}

      {orders && (
        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Store</th>
                <th>Delivered</th>
                <th>Total</th>
                <th>Cash collected</th>
                <th>Rider earning</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.code}</td>
                  <td>{o.store?.name}</td>
                  <td>{when(o.delivered_at)}</td>
                  <td>{peso(o.total)}</td>
                  <td>
                    {peso(o.cash_collected)}
                    {o.cash_note && <span className="rm-cell-note">{o.cash_note}</span>}
                  </td>
                  <td>{peso(o.rider_earning)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Count / verify the cash */}
      {(r.status === 'submitted' || r.status === 'awaiting_cash') && (
        <div className="rm-form">
          {r.status === 'awaiting_cash' && (
            <p className="muted small">The rider hasn't uploaded proof yet. You can still record the count once you receive the cash.</p>
          )}
          <label className="field">
            <span>Cash you counted (₱)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={counted}
              onChange={(e) => {
                setCounted(e.target.value);
                setError('');
              }}
            />
          </label>
          {countedValid && (
            <p className={`rm-diff ${diff < 0 ? 'rm-diff-bad' : 'rm-diff-good'}`}>
              {diff === 0
                ? 'Matches the expected remittance.'
                : diff < 0
                  ? `Short by ${peso(-diff)}. Saving will record a cash shortage and email the rider.`
                  : `Over by ${peso(diff)}. It will be settled and noted.`}
            </p>
          )}
          <label className="field">
            <span>Note (optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Example: Received by Ana, Legazpi office" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onVerify}>
            {busy ? 'Saving...' : diff < 0 ? 'Record cash shortage' : 'Confirm settlement'}
          </button>
        </div>
      )}

      {/* Shortage: review the rider's explanation and decide */}
      {r.status === 'short' && (
        <div className="rm-form">
          <div className="rm-explain">
            <p className="rm-label">Rider's explanation</p>
            {r.rider_explanation ? (
              <>
                <p>{r.rider_explanation}</p>
                <p className="muted small">Sent {when(r.explained_at)}</p>
              </>
            ) : (
              <p className="muted">Waiting for the rider to explain. They were emailed and see this on their dashboard.</p>
            )}
          </div>
          <label className="field">
            <span>Resolution</span>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="">Choose...</option>
              {RESOLUTIONS.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Note to the rider</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Example: Paid ₱20 in cash on Oct 13" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onResolve}>
            {busy ? 'Saving...' : 'Save resolution'}
          </button>
        </div>
      )}

      {/* Settlement record */}
      {(r.status === 'settled' || r.status === 'resolved') && (
        <div className="rm-record">
          {r.status === 'resolved' && (
            <>
              {r.rider_explanation && <p>Rider's explanation: {r.rider_explanation}</p>}
              <p>
                <strong>Resolution:</strong> {RESOLUTIONS.find((x) => x.key === r.resolution)?.label ?? r.resolution}
                {r.resolution_note ? `. ${r.resolution_note}` : ''}
              </p>
            </>
          )}
          {r.admin_note && <p className="muted small">Note: {r.admin_note}</p>}
          <p className="muted small">
            Verified {when(r.verified_at)}
            {r.resolved_at ? ` · Closed ${when(r.resolved_at)}` : ''}
          </p>
        </div>
      )}
    </section>
  );
}

export default function Remittances() {
  const { remittances } = useAdmin();
  const [tab, setTab] = useState('verify');
  const current = TABS.find((t) => t.key === tab);
  const list = remittances.filter((r) => current.match(r.status));

  const settledTotal = remittances
    .filter((r) => r.status === 'settled' || r.status === 'resolved')
    .reduce((sum, r) => sum + Number(r.counted_amount ?? 0), 0);
  const openShortage = remittances
    .filter((r) => r.status === 'short')
    .reduce((sum, r) => sum + Number(r.shortage_amount ?? 0), 0);

  return (
    <div className="page">
      <header className="page-head">
        <h1>COD remittances</h1>
        <p className="muted">Count the cash riders bring in, then settle each shift or record a shortage.</p>
      </header>

       <CashHeld />

      <div className="rm-summary">
        <p>
          <span className="muted small">Total settled</span>
          <strong>{peso(settledTotal)}</strong>
        </p>
        <p>
          <span className="muted small">Open shortages</span>
          <strong className={openShortage > 0 ? 'rm-bad-text' : ''}>{peso(openShortage)}</strong>
        </p>
      </div>

      <div className="rm-tabs" role="tablist" aria-label="Remittance status">
        {TABS.map((t) => {
          const n = remittances.filter((r) => t.match(r.status)).length;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`rm-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} <span className="rm-count">{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <section className="card">
          <p className="muted">
            {tab === 'verify' ? 'No remittances waiting.' : tab === 'short' ? 'No open shortages.' : 'No settled remittances yet.'}
          </p>
        </section>
      ) : (
        list.map((r) => <RemittanceCard key={r.id} r={r} />)
      )}
    </div>
  );
}