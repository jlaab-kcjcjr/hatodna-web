import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, CircleCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const peso = (n) =>
  `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';
// The cutoff is the start of the next period, so the last covered day is one moment before it.
const lastCoveredDay = (cutoff) => day(new Date(new Date(cutoff).getTime() - 1).toISOString());

const METHOD = { gcash: 'GCash', maya: 'Maya' };
const SCHEDULE = { daily: 'Daily', weekly: 'Weekly', twice_monthly: 'Twice a month' };
const TABS = [
  { key: 'due', label: 'Due now' },
  { key: 'all', label: 'All stores' },
  { key: 'history', label: 'History' },
];

// Turns the merchant's saved QR text back into a scannable QR image.
function PayQr({ payload, method }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, { width: 320, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="po-qr">
      {src ? <img src={src} alt={`${METHOD[method] ?? ''} QR code to pay this store`} /> : <p className="muted">Making QR...</p>}
      <ol className="po-steps small">
        <li>Open {METHOD[method] ?? 'GCash or Maya'} on your phone and tap Scan or Pay QR.</li>
        <li>Scan this QR from the screen.</li>
        <li>Enter the exact amount above, check the name, and send.</li>
        <li>Copy the reference number into the box below.</li>
      </ol>
    </div>
  );
}

function DueCard({ s, onPaid }) {
  const [showQr, setShowQr] = useState(false);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const due = Number(s.due_amount) > 0;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(s.account_number);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const markPaid = async () => {
    if (reference.trim().length < 4) {
      setError(`Enter the ${METHOD[s.method] ?? ''} reference number from your receipt.`);
      return;
    }
    setBusy(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('admin_record_payout', {
      p_store_id: s.store_id,
      p_cutoff: s.cutoff,
      p_expected: Number(s.due_amount),
      p_reference: reference.trim(),
      p_note: note.trim(),
    });
    if (rpcError) {
      setError(rpcError.message || 'Could not save the payout.');
      setBusy(false);
      return;
    }
    await onPaid();
  };

  return (
    <section className={`card po-card${due ? ' po-due' : ''}`}>
      <div className="po-head">
        <div>
          <h2 className="po-name">{s.store_name}</h2>
          <p className="muted small">
            {s.town} · {SCHEDULE[s.schedule] ?? s.schedule} payouts
            {s.last_paid_at ? ` · last paid ${day(s.last_paid_at)}` : ' · never paid yet'}
          </p>
        </div>
        <div className="po-amount">
          <strong>{peso(s.due_amount)}</strong>
          <span className="muted small">{due ? 'due now' : 'nothing due'}</span>
        </div>
      </div>

      {due && (
        <dl className="po-rows">
          <div>
            <dt>
              Food sales ({s.due_orders} {s.due_orders === 1 ? 'order' : 'orders'}, up to {lastCoveredDay(s.cutoff)})
            </dt>
            <dd>{peso(s.due_gross)}</dd>
          </div>
          <div>
            <dt>HatodNa commission</dt>
            <dd>− {peso(s.due_commission)}</dd>
          </div>
          <div className="po-total">
            <dt>Send to merchant</dt>
            <dd>{peso(s.due_amount)}</dd>
          </div>
        </dl>
      )}

      {(s.later_orders > 0 || s.waiting_cash_orders > 0) && (
        <p className="muted small">
          {s.later_orders > 0 && `${s.later_orders} newer ${s.later_orders === 1 ? 'order' : 'orders'} (${peso(s.later_amount)}) go in the next payout. `}
          {s.waiting_cash_orders > 0 &&
            `${s.waiting_cash_orders} delivered ${s.waiting_cash_orders === 1 ? 'order is' : 'orders are'} waiting for the rider's cash to be remitted.`}
        </p>
      )}

      <div className="po-account">
        <span className="po-method">{METHOD[s.method] ?? s.method}</span>
        <span>
          <strong>{s.account_name}</strong> · {s.account_number}
        </span>
        <button type="button" className="btn btn-ghost btn-small" onClick={copyNumber}>
          {copied ? <CircleCheck size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy number'}
        </button>
      </div>

      {due && (
        <>
          <button type="button" className="btn btn-outline" onClick={() => setShowQr((v) => !v)}>
            <QrCode size={18} aria-hidden="true" />
            {showQr ? 'Hide QR' : 'Show QR to pay'}
          </button>
          {showQr && <PayQr payload={s.qr_payload} method={s.method} />}

          <div className="po-form">
            <label className="field">
              <span>{METHOD[s.method] ?? ''} reference number</span>
              <input
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  setError('');
                }}
                placeholder="e.g. 1012 345 678901"
              />
            </label>
            <label className="field">
              <span>Note (optional)</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sent by Ana" />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="button" className="btn btn-pili" disabled={busy} onClick={markPaid}>
              {busy ? 'Saving...' : `Mark ${peso(s.due_amount)} as paid`}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default function Payouts() {
  const [tab, setTab] = useState('due');
  const [stores, setStores] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    const [due, past] = await Promise.all([
      supabase.rpc('admin_payouts_due'),
      supabase.from('payouts').select('*, store:stores(name)').order('paid_at', { ascending: false }).limit(200),
    ]);
    if (due.error || past.error) {
      setLoadError((due.error || past.error).message || 'Could not load payouts.');
    } else {
      setLoadError('');
      setStores(due.data ?? []);
      setHistory(past.data ?? []);
    }
    setLoading(false);
  }, []);

  // Loading data from Supabase (an external system) is a valid use of an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const dueStores = stores.filter((s) => Number(s.due_amount) > 0);
  const totalDue = dueStores.reduce((sum, s) => sum + Number(s.due_amount), 0);
  const list = tab === 'due' ? dueStores : stores;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Payouts</h1>
        <p className="muted">
          Send each store its food sales minus commission, on the store's schedule. Only orders whose COD cash has been
          remitted and settled are included.
        </p>
      </header>

      <div className="rm-summary">
        <p>
          <span className="muted small">Due now</span>
          <strong>{peso(totalDue)}</strong>
        </p>
        <p>
          <span className="muted small">Stores to pay</span>
          <strong>{dueStores.length}</strong>
        </p>
      </div>

      <div className="rm-tabs" role="tablist" aria-label="Payouts">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`rm-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="rm-count">
              {t.key === 'due' ? dueStores.length : t.key === 'all' ? stores.length : history.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading payouts...</p>
      ) : loadError ? (
        <section className="card">
          <p className="form-error">{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={load}>
            Try again
          </button>
        </section>
      ) : tab === 'history' ? (
        history.length === 0 ? (
          <section className="card">
            <p className="muted">No payouts sent yet.</p>
          </section>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Paid</th>
                  <th>Store</th>
                  <th>Orders</th>
                  <th className="num">Sales</th>
                  <th className="num">Commission</th>
                  <th className="num">Sent</th>
                  <th>Sent to</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Paid">{when(p.paid_at)}</td>
                    <td data-label="Store">{p.store?.name ?? 'Deleted store'}</td>
                    <td data-label="Orders">{p.order_count}</td>
                    <td data-label="Sales" className="num">
                      {peso(p.gross_sales)}
                    </td>
                    <td data-label="Commission" className="num">
                      {peso(p.commission)}
                    </td>
                    <td data-label="Sent" className="num">
                      <strong>{peso(p.amount)}</strong>
                    </td>
                    <td data-label="Sent to">
                      {METHOD[p.method] ?? p.method} {p.account_number}
                    </td>
                    <td data-label="Reference">
                      {p.reference}
                      {p.note ? <span className="table-sub muted small">{p.note}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : list.length === 0 ? (
        <section className="card">
          <p className="muted">
            {tab === 'due'
              ? 'No payouts due right now. Stores appear here when their payout day arrives.'
              : 'No stores with a payout account yet.'}
          </p>
        </section>
      ) : (
        list.map((s) => <DueCard key={`${s.store_id}-${s.cutoff}-${s.due_amount}`} s={s} onPaid={load} />)
      )}
    </div>
  );
}