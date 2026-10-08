import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { DEMO_ADMIN } from '../data/adminData';
import { COLORS } from '../theme';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';

export default function AdminLogin() {
  const { loggedIn, login } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (loggedIn) return <Navigate to="/admin" replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (!login(email, password)) {
      setError("That email and password don't match an admin account.");
      return;
    }
    navigate('/admin');
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
          <button type="submit" className="btn btn-primary btn-block">
            Log in
          </button>
          <div className="demo-box">
            <strong>Demo account</strong>
            <br />
            Email: {DEMO_ADMIN.email}
            <br />
            Password: {DEMO_ADMIN.password}
          </div>
          <p className="muted small">Only the JLAAB team should have admin access.</p>
        </form>
      </section>
    </div>
  );
}