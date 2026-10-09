import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';

export default function AdminLogin() {
  const { session, profile, profileLoading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session && profile?.role === 'admin') return <Navigate to="/admin" replace />;
  const notAdmin = session && !profileLoading && profile && profile.role !== 'admin';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-hero login-hero-admin">
        <p className="login-brand">HatodNa!</p>
        <h1 className="login-title">Admin dashboard</h1>
        <p className="login-lead">Approve riders and stores, watch orders, and set fees for the whole platform.</p>
        <div className="login-mayon">
          <MayonMark color={COLORS.sili} sun={COLORS.abaca} />
        </div>
        <div className="login-band">
          <BanigBand id="admin-login-band" height={14} />
        </div>
      </section>

      <section className="login-panel">
        {notAdmin ? (
          <div className="login-form">
            <h2>Not an admin account</h2>
            <p className="muted setup-text">
              You're logged in as {session.user.email || 'another account'}, which doesn't have admin access.
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={signOut}>
              Log out and try another account
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={onSubmit}>
            <h2>Admin log in</h2>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoComplete="current-password"
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Logging in...' : 'Log in'}
            </button>
            <p className="muted small login-note">Only the JLAAB team has admin access.</p>
          </form>
        )}
      </section>
    </div>
  );
}