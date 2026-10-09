import { useState } from 'react';
import { FileText, Upload, CircleCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMerchant } from '../context/MerchantContext';
import { LINKS } from '../config/links';
import { PERMITS } from '../data/adminData';
import BanigBand from '../components/BanigBand';
import PermitUploader from './PermitUploader';
import MapPicker from '../components/MapPicker';

const CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Other'];
const TOWNS = ['Legazpi City', 'Daraga', 'Tabaco City', 'Ligao City', 'Camalig', 'Guinobatan', 'Sto. Domingo'];
const MAX_PDF_BYTES = 10 * 1024 * 1024;

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
  const { permits } = useMerchant();
  const missingRequired = PERMITS.filter((p) => p.required && !permits.some((x) => x.permit_type === p.key));

  const content = {
    pending: {
      title: 'Your store is being reviewed',
      text: `Our team is checking your details and permits, and will call you at ${store.phone} within 1 to 2 days. Once approved, you can add your products and start receiving orders.`,
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
          <h2>Your business permits</h2>
          {missingRequired.length > 0 ? (
            <p className="note-box">
              Still needed: {missingRequired.map((p) => p.label).join(', ')}. Please upload them so we can review your
              store.
            </p>
          ) : (
            <p className="muted setup-text">Need to fix a file or add an optional permit? Upload it below.</p>
          )}
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
  const [permitFiles, setPermitFiles] = useState({}); // { registration: File, mayors: File, ... }
  const [location, setLocation] = useState(null);
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

  const onPermit = (permitType, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isPdf = file.type === 'application/pdf';
    if (!isPdf && !file.type.startsWith('image/')) return setError('Upload a photo or a PDF file.');
    if (isPdf && file.size > MAX_PDF_BYTES) return setError('That PDF is too large. Use one under 10 MB.');
    setPermitFiles((f) => ({ ...f, [permitType]: file }));
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
    if (!location) return setError('Pin your store on the map so riders can find you.');
    const missing = PERMITS.filter((p) => p.required && !permitFiles[p.key]);
    if (missing.length > 0) return setError(`Add your ${missing.map((p) => p.label).join(' and ')}.`);

    setBusy(true);
    try {
      await registerStore(
        {
          name: form.name.trim(),
          owner_name: form.owner_name.trim(),
          phone: form.phone.trim(),
          category: form.category,
          town: form.town,
          address: form.address.trim(),
          prep_minutes: prep,
          lat: location.lat,
          lng: location.lng,
        },
        permitFiles
      );
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
          Tell us about your business and upload your permits. Our team reviews every store before it goes live on
          HatodNa.
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

        <h2 className="setup-subtitle">Store location</h2>
        <p className="muted small">
          Stand inside your store and tap "Use my current location," or tap the map where your entrance is. Riders and
          delivery fees use this pin.
        </p>
        <MapPicker
          value={location}
          onChange={(point) => {
            setLocation(point);
            setError('');
          }}
          kind="store"
        />

        <h2 className="setup-subtitle">Business permits</h2>
        <p className="muted small">
          Upload a clear photo or a PDF scan (PDFs up to 10 MB). Files are private: only you and the HatodNa team can see
          them.
        </p>
        <ul className="permit-list">
          {PERMITS.map((p) => {
            const file = permitFiles[p.key];
            return (
              <li key={p.key} className="permit-row">
                <span className={`permit-icon${file ? ' ok' : ''}`}>
                  {file ? <CircleCheck size={20} aria-hidden="true" /> : <FileText size={20} aria-hidden="true" />}
                </span>
                <div className="permit-text">
                  <p className="permit-label">
                    {p.label}
                    {p.required ? (
                      <span className="permit-req">Required</span>
                    ) : (
                      <span className="permit-optional">Optional</span>
                    )}
                  </p>
                  <p className="muted small permit-file">{file ? file.name : 'No file chosen'}</p>
                </div>
                <label className={`btn btn-outline btn-small permit-btn${busy ? ' is-disabled' : ''}`}>
                  <Upload size={16} aria-hidden="true" />
                  {file ? 'Change' : 'Choose file'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    disabled={busy}
                    onChange={(e) => onPermit(p.key, e)}
                  />
                </label>
              </li>
            );
          })}
        </ul>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Submitting and uploading permits...' : 'Submit for review'}
        </button>
      </form>
    </SetupShell>
  );
}