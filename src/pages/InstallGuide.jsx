import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Share } from 'lucide-react';
import MayonMark from '../components/MayonMark';
import BanigBand from '../components/BanigBand';

const GUIDES = {
  iphone: {
    label: 'iPhone',
    steps: [
      'Open this website in Safari.',
      'Tap the Share button (a square with an arrow pointing up) in the toolbar.',
      'Scroll down and tap "Add to Home Screen".',
      'Tap "Add". HatodNa now appears on your home screen like an app.',
    ],
  },
  android: {
    label: 'Android',
    steps: [
      'Open this website in Chrome.',
      'Tap the three-dot menu in the top-right corner.',
      'Tap "Install app" or "Add to Home screen".',
      'Tap "Install". HatodNa now appears on your home screen and in your app list.',
    ],
  },
  computer: {
    label: 'Computer',
    steps: [
      'Open this website in Chrome or Edge.',
      'Click the install icon at the right end of the address bar.',
      'Click "Install". HatodNa opens in its own window with a desktop shortcut.',
    ],
  },
};

function detectDevice() {
  const ua = navigator.userAgent;
  const isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/i.test(ua) || isIPad) return 'iphone';
  if (/android/i.test(ua)) return 'android';
  return 'computer';
}

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallGuide() {
  const [device, setDevice] = useState(detectDevice);
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(isInstalled);

  // Android and desktop Chrome can show their own install popup.
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <div className="install">
      <header className="install-hero">
        <div className="install-hero-inner">
          <Link to="/" className="install-brand">
            HatodNa!
          </Link>
          <h1>Put HatodNa on your phone</h1>
          <p>No app store needed. Add it to your home screen in a few taps, and it opens like a regular app.</p>
          <div className="install-mayon">
            <MayonMark />
          </div>
        </div>
        <div className="install-band">
          <BanigBand id="install-band" height={14} />
        </div>
      </header>

      <main className="install-body">
        {installed ? (
          <p className="install-done">HatodNa is already installed on this device. Open it from your home screen.</p>
        ) : (
          installEvent && (
            <button type="button" className="btn btn-primary btn-block install-now" onClick={install}>
              <Download size={20} aria-hidden="true" />
              Install HatodNa now
            </button>
          )
        )}

        <div className="tabs" role="tablist" aria-label="Choose your device">
          {Object.entries(GUIDES).map(([key, guide]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={device === key}
              className={`tab${device === key ? ' active' : ''}`}
              onClick={() => setDevice(key)}
            >
              {guide.label}
            </button>
          ))}
        </div>

        <ol className="install-steps">
          {GUIDES[device].steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {device === 'iphone' && (
          <p className="install-tip">
            <Share size={18} aria-hidden="true" />
            This is the Share icon to look for in Safari.
          </p>
        )}
      </main>
    </div>
  );
}