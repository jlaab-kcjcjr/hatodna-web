import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';

const RESEND_SECONDS = 60;

export default function MerchantLogin() {
  const { session, signIn, signUp, confirmSignup, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login', 'signup', or 'confirm'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (session) return <Navigate to="/merchant" replace />;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const goToConfirm = (message) => {
    setMode('confirm');
    setCode('');
    setError('');
    setNotice(message);
    setSeconds(RESEND_SECONDS);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (mode === 'confirm') {
      if (code.length < 6) return setError('Enter the 6-digit code from the email.');
      setBusy(true);
      try {
        await confirmSignup(email.trim(), code);
        navigate('/merchant');
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }

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
          goToConfirm(`We sent a 6-digit code to ${email.trim()}. Enter it below, or tap the link in the email.`);
        } else {
          navigate('/merchant');
        }
      }
    } catch (err) {
      // Someone who signed up but never confirmed can finish here.
      if (mode === 'login' && err.message.startsWith('Confirm your email')) {
        try {
          await resendConfirmation(email.trim());
          goToConfirm(`Your email isn't confirmed yet. We sent a new code to ${email.trim()}.`);
        } catch (resendErr) {
          setError(resendErr.message);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setError('');
    setNotice('');
    try {
      await resendConfirmation(email.trim());
      setSeconds(RESEND_SECONDS);
      setNotice('A new code is on its way. Check your Spam or Promotions folder too.');
    } catch (err) {
      setError(err.message);
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
          {mode === 'confirm' ? (
            <>
              <h2>Check your email</h2>
              {notice && <p className="form-success">{notice}</p>}
              <label className="field">
                <span>6-digit code</span>
                <input
                  className="code-input"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  autoFocus
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? 'Confirming...' : 'Confirm and continue'}
              </button>
              <button type="button" className="link-btn login-resend" disabled={seconds > 0} onClick={onResend}>
                {seconds > 0 ? `Send a new code in ${seconds}s` : 'Send a new code'}
              </button>
              <button type="button" className="link-btn login-resend" onClick={() => switchMode('login')}>
                Back to log in
              </button>
            </>
          ) : (
            <>
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
                  : "We'll email you a code to confirm it's really you. Then you'll register your store."}
              </p>
            </>
          )}
        </form>
      </section>
    </div>
  );
}