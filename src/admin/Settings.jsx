import { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { peso } from '../utils/format';

const FIELDS = [
  { key: 'baseDeliveryFee', label: 'Base delivery fee (₱)', hint: 'Charged on every delivery.', min: 0, max: 200 },
  { key: 'perKmFee', label: 'Extra fee per km (₱)', hint: 'Added for each kilometer of distance.', min: 0, max: 50 },
  { key: 'riderSharePercent', label: 'Rider share of delivery fee (%)', hint: 'The rest goes to HatodNa.', min: 50, max: 100 },
  { key: 'defaultCommissionPercent', label: 'Default store commission (%)', hint: 'Used for new stores. You can change it per store.', min: 0, max: 40 },
  { key: 'serviceFee', label: 'Service fee per order (₱)', hint: 'Small fee paid by the customer.', min: 0, max: 50 },
];

const EXAMPLE = { subtotal: 300, distanceKm: 3 };

export default function Settings() {
  const { settings, updateSettings, resetDemo } = useAdmin();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(settings[f.key])])));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
    setSaved(false);
  };

  // Live preview uses what's typed in the form, so you can see the effect before saving.
  const num = (key) => Number(form[key]) || 0;
  const deliveryFee = num('baseDeliveryFee') + num('perKmFee') * EXAMPLE.distanceKm;
  const riderGets = Math.round((deliveryFee * num('riderSharePercent')) / 100);
  const commission = Math.round((EXAMPLE.subtotal * num('defaultCommissionPercent')) / 100);
  const storeGets = EXAMPLE.subtotal - commission;
  const hatodnaGets = commission + (deliveryFee - riderGets) + num('serviceFee');
  const customerPays = EXAMPLE.subtotal + deliveryFee + num('serviceFee');

  const onSubmit = (e) => {
    e.preventDefault();
    for (const f of FIELDS) {
      const value = Number(form[f.key]);
      if (form[f.key] === '' || Number.isNaN(value) || value < f.min || value > f.max) {
        setError(`${f.label} must be between ${f.min} and ${f.max}.`);
        return;
      }
    }
    updateSettings(Object.fromEntries(FIELDS.map((f) => [f.key, Number(form[f.key])])));
    setSaved(true);
  };

  const onReset = () => {
    if (window.confirm('Reset all demo riders, stores, orders, and fees to how they started?')) {
      resetDemo();
      window.location.reload();
    }
  };

  return (
    <form className="page" onSubmit={onSubmit}>
      <header className="page-head">
        <h1>Fees and settings</h1>
        <p className="muted">These rates apply across the whole platform. They're examples; your team sets the real ones.</p>
      </header>

      <div className="settings-grid">
        <section className="card">
          <h2 className="card-title">Rates</h2>
          {FIELDS.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
              <small className="muted">{f.hint}</small>
            </label>
          ))}
        </section>

        <section className="card">
          <h2 className="card-title">Example order</h2>
          <p className="muted small">
            A {peso(EXAMPLE.subtotal)} food order delivered {EXAMPLE.distanceKm} km away, using the rates on the left.
          </p>
          <div className="split">
            <div className="split-row">
              <span>Customer pays</span>
              <span>{peso(customerPays)}</span>
            </div>
            <div className="split-row">
              <span>Store receives</span>
              <span>{peso(storeGets)}</span>
            </div>
            <div className="split-row">
              <span>Rider receives</span>
              <span>{peso(riderGets)}</span>
            </div>
            <div className="split-row split-total">
              <span>HatodNa earns</span>
              <span>{peso(hatodnaGets)}</span>
            </div>
          </div>
          <p className="muted small">
            HatodNa's share is before costs like servers, SMS, payment fees, promos, and staff.
          </p>
        </section>
      </div>

      {error && <p className="form-error save-error">{error}</p>}
      <div className="save-bar">
        <button type="submit" className="btn btn-primary">
          Save rates
        </button>
        {saved && <span className="saved">Saved</span>}
      </div>

      <section className="danger-zone">
        <h2 className="card-title">Demo data</h2>
        <p className="muted small">Undo every approval, suspension, and fee change you made while testing.</p>
        <button type="button" className="btn btn-danger-outline" onClick={onReset}>
          Reset demo data
        </button>
      </section>
    </form>
  );
}