import { useState } from 'react';
import { Store, Wallet, ShieldCheck } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import PermitUploader from './PermitUploader';
import MapPicker from '../components/MapPicker';
import StorePhotos from './StorePhotos';
import PayoutSettings from './PayoutSettings';
import ChangePassword from './ChangePassword';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const trimTime = (time) => (time ?? '').slice(0, 5); // "07:00:00" -> "07:00"

const TABS = [
  { id: 'store', label: 'Store', icon: Store },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'account', label: 'Permits & password', icon: ShieldCheck },
];

// Links like /merchant/settings#payouts open that tab directly.
function tabFromHash() {
  const id = window.location.hash.slice(1);
  return TABS.some((t) => t.id === id) ? id : 'store';
}

export default function StoreSettings() {
  const { store, hours, updateStore, saveHours } = useMerchant();
  const [tab, setTab] = useState(tabFromHash);
  const [form, setForm] = useState({
    name: store.name,
    owner_name: store.owner_name,
    phone: store.phone,
    address: store.address,
    prep_minutes: String(store.prep_minutes),
  });
  const [days, setDays] = useState(() =>
    DISPLAY_ORDER.map((day) => {
      const h = hours.find((x) => x.day_of_week === day);
      return {
        day_of_week: day,
        open_time: trimTime(h?.open_time) || '07:00',
        close_time: trimTime(h?.close_time) || '20:00',
        is_closed: h?.is_closed ?? false,
      };
    })
  );
  const [location, setLocation] = useState(store.lat != null ? { lat: store.lat, lng: store.lng } : null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false); // unsaved changes on the Store tab
  const [busy, setBusy] = useState(false);

  const changed = () => {
    setError('');
    setSaved(false);
    setDirty(true);
  };

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    changed();
  };

  const setDay = (index, changes) => {
    setDays((list) => list.map((d, i) => (i === index ? { ...d, ...changes } : d)));
    changed();
  };

  const openTab = (id) => {
    setTab(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter your store name.');
    if (!form.address.trim()) return setError('Enter your store address so riders can find you.');
    const prep = Number(form.prep_minutes);
    if (!prep || prep < 5 || prep > 120) return setError('Set a preparation time between 5 and 120 minutes.');
    if (!location) return setError('Pin your store location on the map so customers can order from you.');
    const badDay = days.find((d) => !d.is_closed && d.open_time >= d.close_time);
    if (badDay) return setError(`On ${DAY_NAMES[badDay.day_of_week]}, the closing time must be after the opening time.`);

    setBusy(true);
    try {
      await updateStore({
        name: form.name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        prep_minutes: prep,
        lat: location.lat,
        lng: location.lng,
      });
      await saveHours(days);
      setSaved(true);
      setDirty(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Store settings</h1>
        <p className="muted">This is what customers and riders see about your store.</p>
      </header>

      <div className="tabs settings-tabs" role="tablist" aria-label="Store settings sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`tab${tab === t.id ? ' active' : ''}`}
              onClick={() => openTab(t.id)}
            >
              <Icon size={16} aria-hidden="true" />
              {t.label}
              {t.id === 'store' && dirty && <span className="tab-dot" aria-label="(unsaved changes)" />}
            </button>
          );
        })}
      </div>

      {tab === 'store' && (
        <form className="settings-panel" id="panel-store" role="tabpanel" aria-labelledby="tab-store" onSubmit={onSubmit}>
          <section className="card store-photos-card">
            <h2 className="card-title">Store photos</h2>
            <p className="muted small permits-intro">
              Customers see your logo and cover photo on the HatodNa home page and on your store page. Photos save right
              away.
            </p>
            <StorePhotos />
          </section>

          <div className="settings-grid">
            <section className="card">
              <h2 className="card-title">Store details</h2>
              <label className="field">
                <span>Store name</span>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} />
              </label>
              <label className="field">
                <span>Owner name</span>
                <input value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} />
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
                  value={form.prep_minutes}
                  onChange={(e) => set('prep_minutes', e.target.value)}
                />
              </label>
              <p className="muted small">
                Category: {store.category}, Town: {store.town}, Commission:{' '}
                {store.commission_percent != null ? `${store.commission_percent}%` : 'set after approval'}
              </p>
            </section>

            <section className="card">
              <h2 className="card-title">Opening hours</h2>
              {days.map((d, i) => (
                <div key={d.day_of_week} className="hours-row">
                  <span className="hours-day">{DAY_NAMES[d.day_of_week]}</span>
                  <label className="check check-inline">
                    <input
                      type="checkbox"
                      checked={d.is_closed}
                      onChange={(e) => setDay(i, { is_closed: e.target.checked })}
                    />
                    Closed
                  </label>
                  <div className="hours-times">
                    <input
                      type="time"
                      value={d.open_time}
                      disabled={d.is_closed}
                      onChange={(e) => setDay(i, { open_time: e.target.value })}
                      aria-label={`${DAY_NAMES[d.day_of_week]} opening time`}
                    />
                    <span className="muted">to</span>
                    <input
                      type="time"
                      value={d.close_time}
                      disabled={d.is_closed}
                      onChange={(e) => setDay(i, { close_time: e.target.value })}
                      aria-label={`${DAY_NAMES[d.day_of_week]} closing time`}
                    />
                  </div>
                </div>
              ))}
            </section>
          </div>

          <section className="card permits-card">
            <h2 className="card-title">Store location</h2>
            <p className="muted small permits-intro">
              {location
                ? 'This pin is where riders pick up orders. Move it if it is not exactly at your entrance, then save.'
                : 'Your store is not on the map yet. Customers cannot order until you pin your location and save.'}
            </p>
            <MapPicker
              value={location}
              onChange={(point) => {
                setLocation(point);
                changed();
              }}
              kind="store"
            />
          </section>

          {error && <p className="form-error save-error">{error}</p>}
          <div className={`save-bar settings-save${dirty ? ' is-dirty' : ''}`}>
            {dirty && <span className="muted small">You have unsaved changes.</span>}
            {saved && <span className="saved">Saved</span>}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {tab === 'payouts' && (
        <div className="settings-panel" id="panel-payouts" role="tabpanel" aria-labelledby="tab-payouts">
          <section className="card permits-card">
            <h2 className="card-title">Payout account and schedule</h2>
            <PayoutSettings />
          </section>
        </div>
      )}

      {tab === 'account' && (
        <div className="settings-panel" id="panel-account" role="tabpanel" aria-labelledby="tab-account">
          <section className="card permits-card">
            <h2 className="card-title">Business permits</h2>
            <p className="muted small permits-intro">
              Keep your permits up to date. Replace a file when you renew a permit.
            </p>
            <PermitUploader />
          </section>
          <ChangePassword />
        </div>
      )}
    </div>
  );
}