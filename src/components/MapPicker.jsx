import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { DEFAULT_CENTER, TILE_URL, TILE_ATTRIBUTION, pinIcon } from './mapIcons';

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 17);
  }, [target, map]);
  return null;
}

// A map where people tap, drag, or use their phone's location to place a pin.
export default function MapPicker({ value, onChange, kind = 'customer', height = '18rem' }) {
  const [target, setTarget] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const locate = () => {
    if (!navigator.geolocation) {
      setError("This browser can't share your location. Tap the map to place the pin instead.");
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(point);
        setTarget(point);
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Allow location access in your browser, or tap the map to place the pin.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div className="map-section">
      <div className="map-frame" style={{ height }}>
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={value ? 17 : 14}
          scrollWheelZoom={false}
          className="map"
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickToPlace onPick={onChange} />
          <FlyTo target={target} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon(kind)}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  onChange({ lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="map-actions">
        <button type="button" className="map-locate" onClick={locate} disabled={locating}>
          <LocateFixed size={16} aria-hidden="true" />
          {locating ? 'Finding you...' : 'Use my current location'}
        </button>
        <span className="muted small">
          {value ? 'Drag the pin or tap the map to fine-tune it.' : 'Tap the map to place the pin.'}
        </span>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}