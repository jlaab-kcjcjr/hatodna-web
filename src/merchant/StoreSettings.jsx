import { useState } from 'react';
import { useMerchant } from '../context/MerchantContext';

export default function StoreSettings() {
  const { store, updateStore } = useMerchant();
  const [form, setForm] = useState({
    name: store.name,
    owner: store.owner,
    phone: store.phone,
    address: store.address,
    prepMinutes: String(store.prepMinutes),
  });
  const [hours, setHours] = useState(store.hours);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
    setSaved(false);
  };

  const setDay = (index, changes) => {
    setHours((list) => list.map((d, i) => (i === index ? { ...d, ...changes } : d)));
    setError('');
    setSaved(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter your store name.');
    if (!form.address.trim()) return setError('Enter your store address so riders can find you.');
    const prep = Number(form.prepMinutes);
    if (!prep || prep < 5 || prep > 120) return setError('Set a preparation time between 5 and 120 minutes.');
    const badDay = hours.find((d) => !d.closed && d.open >= d.close);
    if (badDay) return setError(`On ${badDay.day}, the closing time must be after the opening time.`);
    updateStore({
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      prepMinutes: prep,
      hours,
    });
    setSaved(true);
  };

  return (
    <form className="page" onSubmit={onSubmit}>
      <header className="page-head">
        <h1>Store settings</h1>
        <p className="muted">This is what customers and riders see about your store.</p>
      </header>

      <div className="settings-grid">
        <section className="card">
          <h2 className="card-title">Store details</h2>
          <label className="field">
            <span>Store name</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="field">
            <span>Owner name</span>
            <input value={form.owner} onChange={(e) => set('owner', e.target.value)} />
          </label>
          <label className="field">
            <span>Contact number</span>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label className="field">
            <span>Store address</span>
            <input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </label>
          <label className="field">
            <span>Usual preparation time (minutes)</span>
            <input
              type="number"
              min="5"
              max="120"
              value={form.prepMinutes}
              onChange={(e) => set('prepMinutes', e.target.value)}
            />
          </label>
        </section>

        <section className="card">
          <h2 className="card-title">Opening hours</h2>
          {hours.map((d, i) => (
            <div key={d.day} className="hours-row">
              <span className="hours-day">{d.day}</span>
              <label className="check check-inline">
                <input type="checkbox" checked={d.closed} onChange={(e) => setDay(i, { closed: e.target.checked })} />
                Closed
              </label>
              <div className="hours-times">
                <input
                  type="time"
                  value={d.open}
                  disabled={d.closed}
                  onChange={(e) => setDay(i, { open: e.target.value })}
                  aria-label={`${d.day} opening time`}
                />
                <span className="muted">to</span>
                <input
                  type="time"
                  value={d.close}
                  disabled={d.closed}
                  onChange={(e) => setDay(i, { close: e.target.value })}
                  aria-label={`${d.day} closing time`}
                />
              </div>
            </div>
          ))}
        </section>
      </div>

      {error && <p className="form-error save-error">{error}</p>}
      <div className="save-bar">
        <button type="submit" className="btn btn-primary">
          Save changes
        </button>
        {saved && <span className="saved">Saved</span>}
      </div>
    </form>
  );
}