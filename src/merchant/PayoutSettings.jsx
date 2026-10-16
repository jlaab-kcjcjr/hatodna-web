/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { CircleCheck, QrCode, AlertTriangle } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import { readQrFromImage, parseQrPh } from '../utils/qrph';

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

// Payout account (GCash or Maya number + QR) and schedule.
// The QR photo is read in the browser and only its text is saved, never the photo.
// Not a <form>, so it can sit inside other forms. Pass `onChange` to collect values instead of saving here.
export default function PayoutSettings({ onSaved, onChange, showSave = true }) {
  const { payout, savePayout } = useMerchant();
  const [method, setMethod] = useState(payout?.method ?? 'gcash');
  const [accountName, setAccountName] = useState(payout?.account_name ?? '');
  const [number, setNumber] = useState(payout?.account_number ?? '');
  const [schedule, setSchedule] = useState(payout?.schedule ?? 'weekly');
  const [qr, setQr] = useState(() => {
    if (!payout?.qr_payload) return null;
    const parsed = parseQrPh(payout.qr_payload);
    return { payload: payout.qr_payload, name: parsed.ok ? parsed.name : '', provider: parsed.ok ? parsed.provider : null, preview: '' };
  });
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const methodLabel = PAYOUT_METHODS.find((m) => m.key === method)?.label ?? 'GCash';
  const qrMismatch = qr?.provider && qr.provider !== method;

  // Tell a parent form (registration) the current values whenever something changes.
  const report = (next) => {
    const values = {
      method,
      account_name: accountName,
      account_number: number,
      schedule,
      qr_payload: qr?.payload ?? '',
      ...next,
    };
    onChange?.(values);
  };

  const touch = (next = {}) => {
    setError('');
    setSaved(false);
    report(next);
  };

  const onQr = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose a screenshot or photo of your QR code.');
    setReading(true);
    setError('');
    try {
      const text = await readQrFromImage(file);
      if (!text) throw new Error("We couldn't find a QR code in that image. Use a clear screenshot of your QR.");
      const parsed = parseQrPh(text);
      if (!parsed.ok) throw new Error(parsed.reason);
      setQr({ payload: text, name: parsed.name, provider: parsed.provider, preview: URL.createObjectURL(file) });
      setSaved(false);
      report({ qr_payload: text });
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  };

  // Shared checks, used by the Save button here and by the registration form.
  const validate = () => {
    if (accountName.trim().length < 3) return `Enter the full name on your ${methodLabel} account.`;
    if (!toLocalMobile(number)) return `Enter your ${methodLabel} mobile number, like 0917 123 4567.`;
    if (!qr?.payload) return `Upload your ${methodLabel} QR code.`;
    if (qrMismatch) return `That QR is from ${qr.provider === 'gcash' ? 'GCash' : 'Maya'}, but you chose ${methodLabel}. Pick the matching option or upload the right QR.`;
    return '';
  };

  const onSave = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    const mobile = toLocalMobile(number);
    setBusy(true);
    setError('');
    try {
      await savePayout({
        method,
        account_name: accountName.trim(),
        account_number: mobile,
        schedule,
        qr_payload: qr.payload,
      });
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
                touch({ method: m.key });
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
            touch({ account_name: e.target.value });
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
            touch({ account_number: e.target.value });
          }}
          placeholder="0917 123 4567"
        />
      </label>

      <span className="field-label-text">{methodLabel} QR code</span>
      <div className={`payout-qr${qr ? ' has-qr' : ''}`}>
        <div className="payout-qr-thumb">
          {qr?.preview ? <img src={qr.preview} alt={`${methodLabel} QR code`} /> : <QrCode size={30} aria-hidden="true" />}
        </div>
        <div className="payout-qr-text">
          {reading ? (
            <p className="payout-qr-title">Reading your QR...</p>
          ) : qr ? (
            <>
              <p className="payout-qr-title">
                <CircleCheck size={16} aria-hidden="true" /> QR read successfully
              </p>
              <p className="muted small">
                Account holder: <strong>{qr.name || 'not shown in QR'}</strong>
                {qr.provider ? ` · ${qr.provider === 'gcash' ? 'GCash' : 'Maya'}` : ''}
              </p>
            </>
          ) : (
            <>
              <p className="payout-qr-title">Upload your {methodLabel} QR</p>
              <p className="muted small">
                In the {methodLabel} app, open your QR (Receive or My QR), take a screenshot, and upload it here.
              </p>
            </>
          )}
          <label className={`btn btn-outline btn-small payout-qr-btn${reading ? ' is-disabled' : ''}`}>
            {qr ? 'Replace QR' : 'Upload QR screenshot'}
            <input type="file" accept="image/*" hidden disabled={reading} onChange={onQr} />
          </label>
        </div>
      </div>
      {qrMismatch && (
        <p className="payout-warn">
          <AlertTriangle size={16} aria-hidden="true" />
          This QR is from {qr.provider === 'gcash' ? 'GCash' : 'Maya'}, but you chose {methodLabel}.
        </p>
      )}

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
                touch({ schedule: s.key });
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
        HatodNa sends your sales (minus commission) to this account on your schedule. We save only the text inside your
        QR, not the picture. Only you and the HatodNa team can see these details.
      </p>

      {error && <p className="form-error">{error}</p>}
      {showSave && (
        <div className="payout-actions">
          <button type="button" className="btn btn-primary" disabled={busy || reading} onClick={onSave}>
            {busy ? 'Saving...' : payout ? 'Update payout details' : 'Save payout details'}
          </button>
          {saved && (
            <span className="saved">
              <CircleCheck size={16} aria-hidden="true" /> Saved
            </span>
          )}
        </div>
      )}
    </div>
  );
}