import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';

export default function MerchantLogin() {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/merchant" replace />;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'signup' && fullName.trim().length < 3) return setError('Enter your full name.');
    if (!email.trim() || !password) return setError('Enter your email and password.');
    if (mode === 'signup' && password.length < 8) return setError('Use a password with at least 8 characters.');

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        navigate('/merchant');
      } else {
        const { needsConfirmation } = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role: 'merchant',
        });
        if (needsConfirmation) {
          setMode('login');
          setNotice('Account created. Check your email for the confirmation link, then log in here.');
        } else {
          navigate('/merchant');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-hero">
        <p className="login-brand">HatodNa!</p>
        <h1 className="login-title">Your store, delivered across Albay.</h1>
        <p className="login-lead">Manage your menu, accept orders, and track your sales in one place.</p>
        <div className="login-mayon">
          <MayonMark />
        </div>
        <div className="login-band">
          <BanigBand id="login-band" height={14} />
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`tab${mode === 'login' ? ' active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`tab${mode === 'signup' ? ' active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Create partner account
            </button>
          </div>

          {notice && <p className="form-success">{notice}</p>}

          {mode === 'signup' && (
            <label className="field">
              <span>Your full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourstore.ph"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          <p className="muted small login-note">
            {mode === 'login'
              ? 'New partner? Choose "Create partner account" above.'
              : "After creating your account, you'll register your store for our team to review."}
          </p>
        </form>
      </section>
    </div>
  );
}