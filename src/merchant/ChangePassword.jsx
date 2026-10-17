import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import PasswordRules from '../components/PasswordRules';
import { missingRules } from '../utils/password';

// Partner portal: change password while logged in. Asks for the current password first,
// so someone using an unlocked phone or shared computer can't take over the account.
export default function ChangePassword() {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [logoutOthers, setLogoutOthers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const close = () => {
    setOpen(false);
    setCurrent('');
    setNext('');
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!current) return setError('Enter your current password.');
    const missing = missingRules(next);
    if (missing.length > 0) return setError(`Your new password still needs: ${missing.join(', ')}.`);
    if (next === current) return setError('Your new password must be different from your current one.');
    setBusy(true);
    try {
      await changePassword(current, next, logoutOthers);
      close();
      setDone(
        logoutOthers
          ? 'Password changed. Your other phones and computers were logged out.'
          : 'Password changed. Use your new password next time you log in.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card change-password">
      <div className="card-head">
        <h2>
          <KeyRound size={18} aria-hidden="true" /> Password
        </h2>
        {!open && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setOpen(true);
              setDone('');
            }}
          >
            Change password
          </button>
        )}
      </div>

      {done && <p className="form-success">{done}</p>}
      {!open && !done && <p className="muted small">Change it anytime, or if you think someone else knows it.</p>}

      {open && (
        <form className="change-password-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Current password</span>
            <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </label>
          <label className="field">
            <span>New password</span>
            <PasswordInput
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              aria-describedby="change-password-rules"
            />
          </label>
          <PasswordRules password={next} id="change-password-rules" />
          <label className="check-row">
            <input type="checkbox" checked={logoutOthers} onChange={(e) => setLogoutOthers(e.target.checked)} />
            <span>Log out my other phones and computers</span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="change-password-actions">
            <button type="button" className="btn" onClick={close} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Save new password'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}