import L from 'leaflet';

export const DEFAULT_CENTER = [13.1391, 123.7438]; // Legazpi City
// Free OpenStreetMap tiles for building and testing. Switch to a commercial tile provider before launch.
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const PIN_COLORS = { store: '#B8202B', customer: '#2E5E3E' };

// Map pins drawn with CSS, in HatodNa colors (sili red for stores, pili green for customers).
export function pinIcon(kind = 'store') {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<span class="map-pin" style="background:${PIN_COLORS[kind] ?? PIN_COLORS.store}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    tooltipAnchor: [0, -26],
  });
}

// A pulsing abaca-gold dot for the rider's live position.
export function riderIcon() {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: '<span class="map-rider"><span></span></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    tooltipAnchor: [0, -12],
  });
}

// Same formula as the database: straight line x 1.3 for roads, rounded up to the next 0.5 km, minimum 1 km.
export function estimateRoadKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const straightKm = 2 * 6371 * Math.asin(Math.sqrt(h));
  return Math.max(1, Math.ceil(straightKm * 1.3 * 2) / 2);
}