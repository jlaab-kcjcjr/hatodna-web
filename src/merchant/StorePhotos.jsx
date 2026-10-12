import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import { publicUrl } from '../utils/images';

const SLOTS = [
  {
    key: 'logo_path',
    label: 'Logo',
    hint: 'A square photo works best, like your Facebook page profile picture.',
    shape: 'logo',
  },
  {
    key: 'image_path',
    label: 'Cover photo',
    hint: 'Your storefront, dining area, or best-selling dish. Wide photos look best.',
    shape: 'cover',
  },
];

// Logo and cover photo. Each one saves as soon as it is chosen.
export default function StorePhotos() {
  const { store, uploadStorePhoto, removeStorePhoto } = useMerchant();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const run = async (key, task) => {
    setBusy(key);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const onPick = (key, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose a photo (JPG or PNG).');
      return;
    }
    run(key, () => uploadStorePhoto(key, file));
  };

  const initials = (store.name || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="store-photos">
      {SLOTS.map((slot) => {
        const url = publicUrl('store-images', store[slot.key]);
        const working = busy === slot.key;
        return (
          <div key={slot.key} className={`store-photo store-photo-${slot.shape}`}>
            <div className="store-photo-frame">
              {url ? (
                <img src={url} alt={`${store.name} ${slot.label.toLowerCase()}`} />
              ) : (
                <span className="store-photo-empty">{slot.shape === 'logo' ? initials : 'No cover photo yet'}</span>
              )}
              {working && <span className="store-photo-busy">Uploading...</span>}
            </div>
            <div className="store-photo-text">
              <p className="store-photo-label">{slot.label}</p>
              <p className="muted small">{slot.hint}</p>
              <div className="store-photo-actions">
                <label className={`btn btn-outline btn-small${working ? ' is-disabled' : ''}`}>
                  <ImagePlus size={16} aria-hidden="true" />
                  {url ? 'Change' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={Boolean(busy)}
                    onChange={(e) => onPick(slot.key, e)}
                  />
                </label>
                {url && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    disabled={Boolean(busy)}
                    onClick={() => run(slot.key, () => removeStorePhoto(slot.key))}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}