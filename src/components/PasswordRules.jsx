import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../utils/password';

// Live checklist under a new-password field. Each rule turns green as it's met.
export default function PasswordRules({ password, id = 'password-rules' }) {
  return (
    <div className="password-rules" id={id}>
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