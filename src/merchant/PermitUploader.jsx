import { useEffect, useState } from 'react';
import { FileText, Upload, CircleCheck } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import { PERMITS } from '../data/adminData';
import { timeAgo } from '../utils/format';

export default function PermitUploader() {
  const { permits, uploadPermit, getPermitUrls } = useMerchant();
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [urls, setUrls] = useState({});

  // Secure view links for the files already uploaded.
  useEffect(() => {
    let cancelled = false;
    getPermitUrls(permits).then((result) => {
      if (!cancelled) setUrls(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permits]);

  const onFile = async (permitType, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusyKey(permitType);
    setError('');
    try {
      await uploadPermit(permitType, file);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div>
      <ul className="permit-list">
        {PERMITS.map((p) => {
          const permit = permits.find((x) => x.permit_type === p.key);
          const url = urls[p.key];
          const busy = busyKey === p.key;
          return (
            <li key={p.key} className="permit-row">
              <span className={`permit-icon${permit ? ' ok' : ''}`}>
                {permit ? <CircleCheck size={20} aria-hidden="true" /> : <FileText size={20} aria-hidden="true" />}
              </span>
              <div className="permit-text">
                <p className="permit-label">
                  {p.label}
                  {p.required && <span className="permit-req">Required</span>}
                </p>
                <p className="muted small">
                  {busy ? 'Uploading...' : permit ? `Uploaded ${timeAgo(permit.uploaded_at)}` : 'Not uploaded yet'}
                  {permit && url && !busy && (
                    <>
                      {', '}
                      <a className="link" href={url} target="_blank" rel="noreferrer">
                        View
                      </a>
                    </>
                  )}
                </p>
              </div>
              <label className={`btn btn-outline btn-small permit-btn${busyKey ? ' is-disabled' : ''}`}>
                <Upload size={16} aria-hidden="true" />
                {permit ? 'Replace' : 'Upload'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  hidden
                  disabled={Boolean(busyKey)}
                  onChange={(e) => onFile(p.key, e)}
                />
              </label>
            </li>
          );
        })}
      </ul>
      {error && <p className="form-error">{error}</p>}
      <p className="muted small">
        Upload a clear photo or a PDF scan (PDFs up to 10 MB). Files are private: only you and the HatodNa team can see
        them.
      </p>
    </div>
  );
}