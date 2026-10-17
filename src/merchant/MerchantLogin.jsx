import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';
import PasswordInput from '../components/PasswordInput';

const RESEND_SECONDS = 60;

// Same rules as Supabase (Authentication → Email → Password requirements), so the form never lets
// through a password the server will reject.
const PASSWORD_RULES = [
  { label: 'At least 8 characters', short: '8 or more characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', short: 'an uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', short: 'a lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', short: 'a number', test: (p) => /[0-9]/.test(p) },
  { label: 'One symbol, like ! @ # $ % & *', short: 'a symbol', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
];

function missingRules(password) {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.short);
}

function PasswordRules({ password }) {
  return (
    <div className="password-rules" id="password-rules">
      <p>Your password must have:</p>
      <ul>
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.label} className={ok ? 'ok' : ''}>
              {ok ? <Check size={15} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function MerchantLogin() {
  const { session, signIn, signUp, confirmSignup, resendConfirmation, sendPasswordReset, verifyResetCode, setNewPassword } =
    useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'confirm', 'forgot' or 'reset'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  // Resetting logs the merchant in when the code is accepted, so we stay on this page
  // until the new password is saved instead of jumping straight to the portal.
  const [resetting, setResetting] = useState(false);
  const [codeAccepted, setCodeAccepted] = useState(false);

  useEffect(() => {
    if (seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (session && !resetting) return <Navigate to="/merchant" replace />;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
    if (next === 'forgot') setPassword('');
  };

  const goToConfirm = (message) => {
    setMode('confirm');
    setCode('');
    setError('');
    setNotice(message);
    setSeconds(RESEND_SECONDS);
  };

  const goToReset = () => {
    setMode('reset');
    setCode('');
    setPassword('');
    setCodeAccepted(false);
    setError('');
    setNotice(
      `If ${email.trim()} has a HatodNa! partner account, we sent it a 6-digit code. Check your Spam or Promotions folder too.`
    );
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

    if (mode === 'forgot') {
      if (!email.trim()) return setError('Enter the email you use for your partner account.');
      setBusy(true);
      try {
        await sendPasswordReset(email.trim());
        goToReset();
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (!codeAccepted && code.length < 6) return setError('Enter the 6-digit code from the email.');
      const missing = missingRules(password);
      if (missing.length > 0) return setError(`Your new password still needs: ${missing.join(', ')}.`);
      setBusy(true);
      setResetting(true);
      try {
        if (!codeAccepted) {
          await verifyResetCode(email.trim(), code);
          setCodeAccepted(true);
        }
        await setNewPassword(password);
        navigate('/merchant', { replace: true });
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'signup' && fullName.trim().length < 3) return setError('Enter your full name.');
    if (!email.trim() || !password) return setError('Enter your email and password.');
    if (mode === 'signup') {
      const missing = missingRules(password);
      if (missing.length > 0) return setError(`Your password still needs: ${missing.join(', ')}.`);
    }

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
      if (mode === 'reset') await sendPasswordReset(email.trim());
      else await resendConfirmation(email.trim());
      setSeconds(RESEND_SECONDS);
      setNotice('A new code is on its way. Check your Spam or Promotions folder too.');
    } catch (err) {
      setError(err.message);
    }
  };

  const codeField = (
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
  );

  const resendButton = (
    <button type="button" className="link-btn login-resend" disabled={seconds > 0} onClick={onResend}>
      {seconds > 0 ? `Send a new code in ${seconds}s` : 'Send a new code'}
    </button>
  );

  const backToLogin = (
    <button type="button" className="link-btn login-resend" onClick={() => switchMode('login')}>
      Back to log in
    </button>
  );

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
              {codeField}
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? 'Confirming...' : 'Confirm and continue'}
              </button>
              {resendButton}
              {backToLogin}
            </>
          ) : mode === 'forgot' ? (
            <>
              <h2>Forgot your password?</h2>
              <p className="muted small">
                Enter the email you use for your partner account. We'll send you a 6-digit code to set a new password.
              </p>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourstore.ph"
                  autoComplete="email"
                  autoFocus
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? 'Sending...' : 'Send code'}
              </button>
              {backToLogin}
            </>
          ) : mode === 'reset' ? (
            <>
              <h2>Set a new password</h2>
              {notice && <p className="form-success">{notice}</p>}
              {codeAccepted ? (
                <p className="form-success">Code accepted. Now choose your new password.</p>
              ) : (
                codeField
              )}
              <label className="field">
                <span>New password</span>
                <PasswordInput
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="new-password"
                  aria-describedby="password-rules"
                />
              </label>
              <PasswordRules password={password} />
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? 'Saving...' : 'Save new password and log in'}
              </button>
              {!codeAccepted && resendButton}
              {!codeAccepted && backToLogin}
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
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  aria-describedby={mode === 'signup' ? 'password-rules' : undefined}
                />
              </label>
              {mode === 'login' && (
                <button type="button" className="link-btn forgot-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              )}
              {mode === 'signup' && <PasswordRules password={password} />}
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