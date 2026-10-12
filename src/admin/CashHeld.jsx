import { AlertTriangle, Phone } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

// When to flag a rider: holding this much cash, or holding it this long.
const WARN_AMOUNT = 3000;
const WARN_HOURS = 12;

const peso = (n) =>
  `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';
const duration = (hours) => {
  const h = Number(hours ?? 0);
  if (h < 1) return 'less than an hour';
  if (h < 24) return `${Math.floor(h)} ${Math.floor(h) === 1 ? 'hour' : 'hours'}`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? 'day' : 'days'}`;
};

// COD cash each rider is holding right now, highest first.
export default function CashHeld() {
  const { cashHeld } = useAdmin();
  const total = cashHeld.reduce((sum, r) => sum + Number(r.total_held ?? 0), 0);
  const flagged = cashHeld.filter(
    (r) => Number(r.total_held) >= WARN_AMOUNT || Number(r.hours_held) >= WARN_HOURS
  ).length;

  return (
    <section className="card ch-card">
      <div className="ch-head">
        <div>
          <h2 className="ch-title">Cash held by riders</h2>
          <p className="muted small">
            COD cash riders have collected but not handed over yet. Flags: {peso(WARN_AMOUNT)} or more, or held{' '}
            {WARN_HOURS}+ hours.
          </p>
        </div>
        <div className="ch-total">
          <span className="muted small">Total held</span>
          <strong>{peso(total)}</strong>
          {flagged > 0 && <span className="ch-flag-count">{flagged} flagged</span>}
        </div>
      </div>

      {cashHeld.length === 0 ? (
        <p className="muted">No rider is holding COD cash right now.</p>
      ) : (
        <ul className="ch-list">
          {cashHeld.map((r) => {
            const high = Number(r.total_held) >= WARN_AMOUNT;
            const long = Number(r.hours_held) >= WARN_HOURS;
            return (
              <li key={r.rider_id} className={`ch-row${high || long ? ' ch-row-flag' : ''}`}>
                <div className="ch-who">
                  <p className="ch-name">
                    <span className={`ch-dot${r.is_online ? ' on' : ''}`} aria-hidden="true" />
                    {r.full_name || 'Rider'}
                    <span className="sr-only">{r.is_online ? ' (online)' : ' (offline)'}</span>
                  </p>
                  <p className="muted small">
                    {r.town}
                    {r.phone && (
                      <>
                        {' · '}
                        <span className="ch-phone">
                          <Phone size={12} aria-hidden="true" />
                          {r.phone}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="muted small">
                    {r.order_count} {r.order_count === 1 ? 'delivery' : 'deliveries'} · holding for {duration(r.hours_held)}{' '}
                    (since {when(r.held_since)})
                  </p>
                  {Number(r.handover_amount) > 0 && (
                    <p className="ch-handover small">
                      Ended shift: {peso(r.handover_amount)} on the way to the office
                    </p>
                  )}
                  {(high || long) && (
                    <p className="ch-warn small">
                      <AlertTriangle size={14} aria-hidden="true" />
                      {high && long
                        ? 'High amount, held a long time'
                        : high
                          ? 'High amount'
                          : 'Held a long time'}
                    </p>
                  )}
                </div>
                <div className="ch-amount">
                  <strong>{peso(r.total_held)}</strong>
                  <span className="muted small">to remit</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}