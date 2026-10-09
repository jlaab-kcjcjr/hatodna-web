import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMerchant } from '../context/MerchantContext';
import { LINKS } from '../config/links';
import BanigBand from '../components/BanigBand';
import PermitUploader from './PermitUploader';

const CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Other'];
const TOWNS = ['Legazpi City', 'Daraga', 'Tabaco City', 'Ligao City', 'Camalig', 'Guinobatan', 'Sto. Domingo'];

// Simple page frame for screens shown before a store is approved.
export function SetupShell({ children }) {
  const { signOut } = useAuth();
  return (
    <div className="setup">
      <header className="setup-header">
        <p className="setup-brand">
          HatodNa! <span className="setup-sub">Partner portal</span>
        </p>
        <button type="button" className="btn btn-on-dark" onClick={signOut}>
          Log out
        </button>
      </header>
      <BanigBand id="setup-band" height={10} />
      <main className="setup-body">{children}</main>
    </div>
  );
}

function StoreStatus({ store }) {
  const content = {
    pending: {
      title: 'Your store is being reviewed',
      text: `Our team is checking your details and will call you at ${store.phone} within 1 to 2 days. Once approved, you can add your products and start receiving orders.`,
    },
    rejected: {
      title: "We couldn't approve your store yet",
      text: store.status_note || 'Please contact us so we can help you complete your application.',
    },
    suspended: {
      title: 'Your store is paused',
      text: store.status_note || 'Please contact us for details.',
    },
  }[store.status];

  return (
    <>
      <section className="card setup-status">
        <h1>{content.title}</h1>
        <p className="muted setup-text">{content.text}</p>
        <p className="small">
          {store.name}, {store.address}
        </p>
        <p className="small setup-contact">
          Questions? Email{' '}
          <a className="link" href={`mailto:${LINKS.email}`}>
            {LINKS.email}
          </a>
        </p>
      </section>

      {store.status !== 'suspended' && (
        <section className="card setup-permits">
          <h2>Upload your business permits</h2>
          <p className="muted setup-text">
            We need your DTI or SEC registration and your Mayor's permit before we can approve your store. Uploading them
            now speeds up your review.
          </p>
          <PermitUploader />
        </section>
      )}
    </>
  );
}

export default function StoreSetup() {
  const { profile } = useAuth();
  const { store, registerStore } = useMerchant();
  const [form, setForm] = useState({
    name: '',
    owner_name: profile?.full_name ?? '',
    phone: '',
    category: '',
    town: '',
    address: '',
    prep_minutes: '20',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (store) {
    return (
      <SetupShell>
        <StoreStatus store={store} />
      </SetupShell>
    );
  }

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError('Enter your store name.');
    if (form.owner_name.trim().length < 3) return setError("Enter the owner's full name.");
    if (form.phone.replace(/\D/g, '').length < 10) return setError('Enter a mobile number we can call.');
    if (!form.category) return setError('Choose what you sell.');
    if (!form.town) return setError('Choose your town.');
    if (form.address.trim().length < 5) return setError('Enter your full store address so riders can find you.');
    const prep = Number(form.prep_minutes);
    if (!prep || prep < 5 || prep > 120) return setError('Set a preparation time between 5 and 120 minutes.');

    setBusy(true);
    try {
      await registerStore({
        name: form.name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        category: form.category,
        town: form.town,
        address: form.address.trim(),
        prep_minutes: prep,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <SetupShell>
      <form className="card" onSubmit={onSubmit}>
        <h1 className="setup-title">Register your store</h1>
        <p className="muted setup-text">
          Tell us about your business. Next, you'll upload your permits, and our team reviews every store before it goes
          live on HatodNa.
        </p>
        <label className="field">
          <span>Store name</span>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Tiya Nena Carinderia" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Owner's full name</span>
            <input value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} />
          </label>
          <label className="field">
            <span>Mobile number</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="0917 123 4567"
            />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>What do you sell?</span>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Choose one</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Town</span>
            <select value={form.town} onChange={(e) => set('town', e.target.value)}>
              <option value="">Choose a town</option>
              {TOWNS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Store address</span>
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Street, barangay, town"
          />
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
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit for review'}
        </button>
      </form>
    </SetupShell>
  );
}