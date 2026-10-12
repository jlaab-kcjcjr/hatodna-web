import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// A password box with a show/hide button. Accepts the same props as a normal <input>.
export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-wrap">
      <input {...props} type={visible ? 'text' : 'password'} className={className} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}