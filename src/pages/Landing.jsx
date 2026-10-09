import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShoppingBasket,
  Bike,
  Package,
  Smartphone,
  CircleCheck,
  Clock,
  Wallet,
  BadgePercent,
  Store,
  Users,
  MapPin,
} from 'lucide-react';
import { LINKS } from '../config/links';
import { COLORS } from '../theme';
import { greeting } from '../utils/format';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';
import { supabase } from '../lib/supabase';

const YEAR = new Date().getFullYear();

const SERVICES = [
  { Icon: UtensilsCrossed, title: 'Food', text: 'Bicol Express, laing, pinangat and more from local carinderias and restaurants.' },
  { Icon: ShoppingBasket, title: 'Groceries', text: 'Rice, eggs, gata and everyday needs from stores near you.' },
  { Icon: Bike, title: 'Pabili', text: 'Need something from the palengke or the pharmacy? A rider buys it for you.', soon: true },
  { Icon: Package, title: 'Padala', text: 'Send a parcel across town, delivered the same day.', soon: true },
];

const STEPS = [
  'Choose a store and add what you want to your cart.',
  'The store prepares your order while we find a rider near you.',
  'Your rider brings it to your door. Pay in cash when it arrives.',
];

const TOWNS = [
  { name: 'Legazpi City', live: true },
  { name: 'Daraga', live: true },
  { name: 'Tabaco City', live: false },
  { name: 'Ligao City', live: false },
  { name: 'Camalig', live: false },
  { name: 'Guinobatan', live: false },
];

const RIDER_PERKS = [
  { Icon: Clock, text: 'Go online when you want. No fixed schedule.' },
  { Icon: Wallet, text: 'See what you will earn before you accept a delivery.' },
  { Icon: MapPin, text: 'Deliver in your own town, on routes you already know.' },
];

const PARTNER_PERKS = [
  { Icon: BadgePercent, text: 'Fair, low commission, so more of every sale stays with you.' },
  { Icon: Store, text: 'A free partner portal to manage your menu, prices and orders.' },
  { Icon: Users, text: 'New customers across Albay, with riders handling every delivery.' },
];

const FAQS = [
  {
    q: 'Where does HatodNa deliver?',
    a: 'We are starting in Legazpi City and Daraga, then expanding to Tabaco, Ligao and the rest of Albay.',
  },
  {
    q: 'How do I pay?',
    a: 'Cash on delivery for now. GCash and Maya are coming soon.',
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. Open our website on your phone and add it to your home screen. It opens like a regular app, with no app store needed.',
  },
  {
    q: 'How much is the delivery fee?',
    a: 'It depends on the distance between the store and your address. You always see the full amount before you place your order.',
  },
  {
    q: 'How do I become a rider?',
    a: 'Sign up on the HatodNa Rider website with your ID, vehicle details and documents. Our team reviews applications within 1 to 2 days.',
  },
  {
    q: 'How can my store join?',
    a: 'Fill out the partner form on this page. We will call you to talk about permits, commission and how to set up your menu.',
  },
];

const PARTNER_TOWNS = ['Legazpi City', 'Daraga', 'Tabaco City', 'Ligao City', 'Camalig', 'Guinobatan', 'Sto. Domingo', 'Other town'];
const PARTNER_CATEGORIES = ['Food', 'Grocery', 'Pharmacy', 'Other'];
const EMPTY_FORM = { store: '', owner: '', phone: '', town: '', category: '', message: '' };

function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function PartnerForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const inputProps = (key) => ({
    id: `apply-${key}`,
    value: form[key],
    onChange: (e) => set(key, e.target.value),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `apply-${key}-error` : undefined,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.store.trim().length < 2) next.store = 'Enter your store name.';
    if (form.owner.trim().length < 3) next.owner = "Enter the owner's full name.";
    const digits = form.phone.replace(/\D/g, '').replace(/^63/, '').replace(/^0/, '');
    if (!/^9\d{9}$/.test(digits)) next.phone = 'Enter a mobile number like 0917 123 4567.';
    if (!form.town) next.town = 'Choose your town.';
    if (!form.category) next.category = 'Choose what you sell.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    setSendError('');
    // Saved to the database. It appears in the admin dashboard for the team to follow up.
    const { error } = await supabase.from('partner_applications').insert({
      store_name: form.store.trim(),
      owner_name: form.owner.trim(),
      phone: `+63${digits}`,
      town: form.town,
      category: form.category,
      message: form.message.trim(),
    });
    setSending(false);
    if (error) {
      setSendError('We could not send your application. Please check your connection and try again.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="apply-done" role="status">
        <CircleCheck size={32} aria-hidden="true" />
        <h3>Dios mabalos, {form.owner.trim().split(' ')[0]}!</h3>
        <p>
          We received the application for {form.store.trim()}. Our team will call you at {form.phone.trim()} within 1 to
          2 days. You can also create your partner account now so you're ready.
        </p>
        <Link to="/merchant/login" className="btn btn-primary apply-next">
          Create partner account
        </Link>
      </div>
    );
  }

  return (
    <form className="lp-apply" onSubmit={onSubmit} noValidate>
      <h3 className="lp-apply-title">Apply as a partner store</h3>
      <Field id="apply-store" label="Store name" error={errors.store}>
        <input {...inputProps('store')} placeholder="Tiya Nena Carinderia" autoComplete="organization" />
      </Field>
      <div className="field-row">
        <Field id="apply-owner" label="Owner's name" error={errors.owner}>
          <input {...inputProps('owner')} placeholder="Juan Dela Cruz" autoComplete="name" />
        </Field>
        <Field id="apply-phone" label="Mobile number" error={errors.phone}>
          <input {...inputProps('phone')} type="tel" inputMode="tel" placeholder="0917 123 4567" autoComplete="tel" />
        </Field>
      </div>
      <div className="field-row">
        <Field id="apply-town" label="Town" error={errors.town}>
          <select {...inputProps('town')}>
            <option value="">Choose a town</option>
            {PARTNER_TOWNS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field id="apply-category" label="What do you sell?" error={errors.category}>
          <select {...inputProps('category')}>
            <option value="">Choose one</option>
            {PARTNER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="apply-message" label="Anything we should know? (optional)">
        <textarea {...inputProps('message')} rows={3} placeholder="Your best-sellers, opening hours, or questions for us." />
      </Field>
      {sendError && <p className="form-error">{sendError}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
        {sending ? 'Sending...' : 'Send application'}
      </button>
      <p className="muted small lp-apply-note">
        Already a partner?{' '}
        <Link to="/merchant" className="link">
          Log in to the partner portal
        </Link>
      </p>
    </form>
  );
}

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-header">
        <a href="#top" className="lp-brand">
          HatodNa!
        </a>
        <nav className="lp-nav" aria-label="Page sections">
          <a href="#how">How it works</a>
          <a href="#riders">Ride with us</a>
          <a href="#partners">For stores</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a href={LINKS.customer} className="btn btn-primary lp-order">
          Order now
        </a>
      </header>

      <main>
        <section id="top" className="lp-hero">
          <div className="lp-hero-inner">
            <p className="lp-kicker">{greeting()}, Albay!</p>
            <h1 className="lp-title">Albay's own delivery.</h1>
            <p className="lp-lead">
              Food from your favorite carinderia, groceries and everyday needs, brought to your door by riders from your
              own town.
            </p>
            <div className="lp-cta">
              <a href={LINKS.customer} className="btn btn-light">
                Order now
              </a>
              <a href={`${LINKS.customer}/install`} className="btn btn-outline-light">
                <Smartphone size={18} aria-hidden="true" />
                Add to your phone
              </a>
            </div>
          </div>
          <div className="lp-hero-art">
            <MayonMark color={COLORS.siliDeep} sun={COLORS.abaca} />
          </div>
          <BanigBand id="lp-hero-band" height={16} />
        </section>

        <section className="lp-section" aria-labelledby="services-title">
          <div className="lp-wrap">
            <h2 id="services-title" className="lp-heading">
              Everything your day needs, from the stores you already love.
            </h2>
            <div className="lp-services">
              {SERVICES.map(({ Icon, title, text, soon }) => (
                <article key={title} className="lp-service">
                  <span className="lp-service-icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3>
                    {title}
                    {soon && <span className="lp-soon">Coming soon</span>}
                  </h3>
                  <p className="muted">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="lp-section lp-how" aria-labelledby="how-title">
          <div className="lp-wrap">
            <h2 id="how-title" className="lp-heading">
              How it works
            </h2>
            <ol className="lp-steps">
              {STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <h3 className="lp-towns-title">Where we deliver</h3>
            <ul className="lp-towns">
              {TOWNS.map((t) => (
                <li key={t.name} className={`lp-town${t.live ? ' live' : ''}`}>
                  {t.name}
                  {!t.live && <span className="lp-town-soon"> (soon)</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="riders" className="lp-section lp-riders" aria-labelledby="riders-title">
          <div className="lp-wrap lp-split">
            <div>
              <h2 id="riders-title" className="lp-heading">
                Ride with HatodNa.
              </h2>
              <p className="lp-sub">Earn by delivering around your town, on your own schedule.</p>
              <ul className="lp-perks">
                {RIDER_PERKS.map(({ Icon, text }) => (
                  <li key={text}>
                    <Icon size={20} aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-rider-card">
              <h3>Motorcycle, tricycle or bicycle</h3>
              <p>
                Sign up with your ID and vehicle details. Once approved, go online and start receiving delivery requests.
              </p>
              <a href={LINKS.rider} className="btn btn-light">
                Sign up as a rider
              </a>
            </div>
          </div>
        </section>

        <section id="partners" className="lp-section" aria-labelledby="partners-title">
          <div className="lp-wrap lp-split lp-split-top">
            <div>
              <h2 id="partners-title" className="lp-heading">
                Grow your store with us.
              </h2>
              <p className="lp-sub">
                Carinderias, restaurants, groceries and pharmacies across Albay can reach more customers without hiring
                their own delivery team.
              </p>
              <ul className="lp-perks lp-perks-light">
                {PARTNER_PERKS.map(({ Icon, text }) => (
                  <li key={text}>
                    <Icon size={20} aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <PartnerForm />
          </div>
        </section>

        <section id="faq" className="lp-section lp-faq-section" aria-labelledby="faq-title">
          <div className="lp-wrap">
            <h2 id="faq-title" className="lp-heading">
              Questions
            </h2>
            <div className="lp-faq">
              {FAQS.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <BanigBand id="lp-footer-band" height={12} />
        <div className="lp-wrap lp-footer-inner">
          <div>
            <p className="lp-footer-brand">HatodNa!</p>
            <p className="lp-footer-text">Delivery made in Albay by JLAAB Dev Studio.</p>
          </div>
          <div>
            <h3>HatodNa</h3>
            <ul>
              <li>
                <a href={LINKS.customer}>Order now</a>
              </li>
              <li>
                <a href={LINKS.rider}>Ride with us</a>
              </li>
              <li>
                <Link to="/merchant">Partner portal</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Contact</h3>
            <ul>
              <li>
                <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
              </li>
              <li>Legazpi City, Albay</li>
            </ul>
          </div>
        </div>
        <p className="lp-wrap lp-copy">© {YEAR} JLAAB Dev Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}