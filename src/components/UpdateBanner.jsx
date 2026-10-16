import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const CHECK_EVERY_MS = 5 * 60 * 1000; // every 5 minutes, plus whenever the rider comes back to the app

// The app file this phone is running right now, e.g. "/assets/index-Bx12ab.js".
// Only exists on the live site (not with "npm run dev"), so the check stays off while developing.
function runningScript() {
  return document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute('src') ?? null;
}

// Asks Vercel for the newest page and checks if it still points to the same app file.
async function newVersionOut(current) {
  const res = await fetch(`/?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return false;
  const html = await res.text();
  const latest = [...html.matchAll(/src="([^"]*\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  return latest.length > 0 && !latest.includes(current);
}

// "New version available" bar. The rider taps it when ready, so a delivery in progress is never interrupted.
export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const current = runningScript();
    if (!current) return;
    let stopped = false;

    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        if (await newVersionOut(current)) {
          stopped = true;
          setReady(true);
        }
      } catch {
        // No signal right now. We'll try again on the next check.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', check);
    check();
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', check);
    };
  }, []);

  const update = async () => {
    setBusy(true);
    try {
      // If the app was installed to the home screen, clear its saved copy too.
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Reload anyway.
    }
    window.location.reload();
  };

  if (!ready) return null;

  return (
    <div className="update-banner" role="status">
      <p>A new version of HatodNa! is out.</p>
      <button type="button" onClick={update} disabled={busy}>
        <RefreshCw size={16} aria-hidden="true" className={busy ? 'spin' : ''} />
        {busy ? 'Updating...' : 'Update now'}
      </button>
    </div>
  );
}