import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMerchant } from '../context/MerchantContext';
import { DEMO_LOGIN } from '../data/merchantData';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';

export default function MerchantLogin() {
  const { loggedIn, login } = useMerchant();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (loggedIn) return <Navigate to="/merchant" replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (!login(email, password)) {
      setError("That email and password don't match. Check them and try again.");
      return;
    }
    navigate('/merchant');
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
          <h2>Partner log in</h2>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="you@yourstore.ph"
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
          <button className="btn btn-primary btn-block" type="submit">
            Log in
          </button>
          <div className="demo-box">
            <strong>Demo account</strong>
            <br />
            Email: {DEMO_LOGIN.email}
            <br />
            Password: {DEMO_LOGIN.password}
          </div>
          <p className="muted small">Not a partner yet? Store applications will open on our main website soon.</p>
        </form>
      </section>
    </div>
  );
}