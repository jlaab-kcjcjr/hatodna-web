/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';

export const PAYOUT_METHODS = [
  { key: 'gcash', label: 'GCash' },
  { key: 'maya', label: 'Maya' },
];

export const PAYOUT_SCHEDULES = [
  { key: 'daily', label: 'Daily', hint: 'Next day, for the previous day’s delivered orders' },
  { key: 'weekly', label: 'Weekly', hint: 'Every Monday, for last Monday to Sunday' },
  { key: 'twice_monthly', label: 'Twice a month', hint: 'On the 15th and the last day of the month' },
];

// "0917 123 4567", "+63 917 123 4567" or "639171234567" -> "09171234567"
export function toLocalMobile(input) {
  let digits = (input ?? '').replace(/\D/g, '');
  if (digits.startsWith('63')) digits = `0${digits.slice(2)}`;
  if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`;
  return /^09\d{9}$/.test(digits) ? digits : null;
}

// Payout account (GCash or Maya) and schedule. Not a <form>, so it can sit inside other forms.
export default function PayoutSettings({ onSaved }) {
  const { payout, savePayout } = useMerchant();
  const [method, setMethod] = useState(payout?.method ?? 'gcash');
  const [accountName, setAccountName] = useState(payout?.account_name ?? '');
  const [number, setNumber] = useState(payout?.account_number ?? '');
  const [schedule, setSchedule] = useState(payout?.schedule ?? 'weekly');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const touch = () => {
    setError('');
    setSaved(false);
  };

  const methodLabel = PAYOUT_METHODS.find((m) => m.key === method)?.label ?? 'GCash';

  const onSave = async () => {
    if (accountName.trim().length < 3) return setError(`Enter the full name on your ${methodLabel} account.`);
    const mobile = toLocalMobile(number);
    if (!mobile) return setError(`Enter your ${methodLabel} mobile number, like 0917 123 4567.`);
    setBusy(true);
    setError('');
    try {
      await savePayout({ method, account_name: accountName.trim(), account_number: mobile, schedule });
      setNumber(mobile);
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="payout">
      <span className="field-label-text">Payout account</span>
      <div className="payout-options" role="radiogroup" aria-label="Payout method">
        {PAYOUT_METHODS.map((m) => (
          <label key={m.key} className={`payout-option${method === m.key ? ' active' : ''}`}>
            <input
              type="radio"
              name="payout-method"
              value={m.key}
              checked={method === m.key}
              onChange={() => {
                setMethod(m.key);
                touch();
              }}
            />
            {m.label}
          </label>
        ))}
      </div>

      <label className="field">
        <span>Account name (as registered in {methodLabel})</span>
        <input
          value={accountName}
          onChange={(e) => {
            setAccountName(e.target.value);
            touch();
          }}
          placeholder="Juan Dela Cruz"
          autoComplete="name"
        />
      </label>
      <label className="field">
        <span>{methodLabel} mobile number</span>
        <input
          type="tel"
          inputMode="tel"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            touch();
          }}
          placeholder="0917 123 4567"
        />
      </label>

      <span className="field-label-text">Payout schedule</span>
      <div className="payout-schedules" role="radiogroup" aria-label="Payout schedule">
        {PAYOUT_SCHEDULES.map((s) => (
          <label key={s.key} className={`payout-schedule${schedule === s.key ? ' active' : ''}`}>
            <input
              type="radio"
              name="payout-schedule"
              value={s.key}
              checked={schedule === s.key}
              onChange={() => {
                setSchedule(s.key);
                touch();
              }}
            />
            <span>
              <strong>{s.label}</strong>
              <span className="muted small">{s.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="muted small">
        HatodNa sends your sales (minus commission) to this account on your schedule. Only you and the HatodNa team can
        see these details.
      </p>

      {error && <p className="form-error">{error}</p>}
      <div className="payout-actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onSave}>
          {busy ? 'Saving...' : payout ? 'Update payout details' : 'Save payout details'}
        </button>
        {saved && (
          <span className="saved">
            <CircleCheck size={16} aria-hidden="true" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}