import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useMerchant } from '../context/MerchantContext';
import { peso } from '../utils/format';

const METHOD = { gcash: 'GCash', maya: 'Maya' };
const SCHEDULE = { daily: 'daily', weekly: 'every Monday', twice_monthly: 'twice a month' };
const day = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// Partner portal card: earnings not paid out yet, and the latest payouts HatodNa sent.
export default function PayoutsReceived() {
  const { store, orders, payout } = useMerchant();
  const [result, setResult] = useState({ storeId: null, list: [] });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('payouts')
      .select('id, amount, order_count, method, account_number, reference, paid_at')
      .eq('store_id', store.id)
      .order('paid_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!cancelled) setResult({ storeId: store.id, list: data ?? [] });
      });
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const list = result.storeId === store.id ? result.list : [];
  const unpaid = orders.filter((o) => o.status === 'delivered' && !o.payout_id);
  const unpaidAmount = unpaid.reduce((sum, o) => sum + Number(o.subtotal) - Number(o.commission_amount ?? 0), 0);

  return (
    <section className="card payouts-card">
      <div className="card-head">
        <h2>Payouts</h2>
        <Link to="/merchant/settings" className="link">
          Payout settings
        </Link>
      </div>

      <div className="payouts-next">
        <p className="muted small">Earned, not paid out yet</p>
        <p className="payouts-next-amount">{peso(unpaidAmount)}</p>
        <p className="muted small">
          From {unpaid.length} delivered {unpaid.length === 1 ? 'order' : 'orders'}.{' '}
          {payout
            ? `HatodNa sends your earnings ${SCHEDULE[payout.schedule] ?? ''} to ${METHOD[payout.method] ?? ''} ${payout.account_number}, after the riders' cash is remitted.`
            : 'Add your GCash or Maya in Store settings so we can pay you.'}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="muted small">No payouts yet. Your first one will show here with its reference number.</p>
      ) : (
        <ul className="payouts-list">
          {list.map((p) => (
            <li key={p.id}>
              <div>
                <p className="payouts-amount">{peso(p.amount)}</p>
                <p className="muted small">
                  {day(p.paid_at)} · {p.order_count} {p.order_count === 1 ? 'order' : 'orders'} · {METHOD[p.method] ?? p.method}{' '}
                  {p.account_number}
                </p>
              </div>
              <span className="payouts-ref small">Ref {p.reference}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}