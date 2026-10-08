// Demo data for the admin dashboard. Later, all of this comes from the backend.

const NOW = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const DEMO_ADMIN = { email: 'admin@hatodna.ph', password: 'admin123' };

// Example rates. Your team decides the real ones.
export const DEFAULT_SETTINGS = {
  baseDeliveryFee: 39,
  perKmFee: 8,
  riderSharePercent: 80,
  defaultCommissionPercent: 15,
  serviceFee: 10,
};

export const STATUS_LABEL = {
  pending: 'Pending review',
  approved: 'Approved',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
  preparing: 'Preparing',
  on_the_way: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const DOC_LABELS = {
  license: "Driver's license",
  orcr: 'Vehicle OR/CR',
  clearance: 'NBI or police clearance',
  selfie: 'Selfie with ID',
};

export const requiredDocsFor = (vehicle) =>
  vehicle === 'Bicycle' ? ['clearance', 'selfie'] : ['license', 'orcr', 'clearance', 'selfie'];

export const PERMITS = [
  { key: 'registration', label: 'DTI or SEC registration', required: true },
  { key: 'mayors', label: "Mayor's permit", required: true },
  { key: 'bir', label: 'BIR certificate', required: false },
  { key: 'sanitary', label: 'Sanitary permit', required: false },
];

export const INITIAL_RIDERS = [
  { id: 'r1', name: 'Mark Anthony Reyes', phone: '+63 917 210 4481', town: 'Legazpi City', vehicle: 'Motorcycle', plate: 'ABC 1234', docs: ['license', 'orcr', 'clearance', 'selfie'], status: 'pending', appliedAt: NOW - 3 * HOUR, deliveries: 0, rating: null, note: '' },
  { id: 'r2', name: 'Joy Bañares', phone: '+63 928 554 0193', town: 'Daraga', vehicle: 'Bicycle', plate: '', docs: ['clearance', 'selfie'], status: 'pending', appliedAt: NOW - 1 * DAY, deliveries: 0, rating: null, note: '' },
  { id: 'r6', name: 'Dennis Lorenzo', phone: '+63 935 781 2240', town: 'Legazpi City', vehicle: 'Motorcycle', plate: 'NBQ 5521', docs: ['license', 'orcr', 'selfie'], status: 'pending', appliedAt: NOW - 2 * DAY, deliveries: 0, rating: null, note: '' },
  { id: 'r3', name: 'Ramil Oñate', phone: '+63 916 332 9087', town: 'Legazpi City', vehicle: 'Motorcycle', plate: 'KAB 7782', docs: ['license', 'orcr', 'clearance', 'selfie'], status: 'approved', appliedAt: NOW - 40 * DAY, deliveries: 182, rating: 4.8, note: '' },
  { id: 'r4', name: 'Celso Prado', phone: '+63 927 118 6630', town: 'Tabaco City', vehicle: 'Tricycle', plate: 'TRC 3310', docs: ['license', 'orcr', 'clearance', 'selfie'], status: 'approved', appliedAt: NOW - 25 * DAY, deliveries: 64, rating: 4.6, note: '' },
  { id: 'r5', name: 'Arnel Sy', phone: '+63 945 220 7718', town: 'Daraga', vehicle: 'Motorcycle', plate: 'DRG 9014', docs: ['license', 'orcr', 'clearance', 'selfie'], status: 'suspended', appliedAt: NOW - 60 * DAY, deliveries: 97, rating: 4.1, note: 'Unremitted COD cash for 5 days.' },
];

export const INITIAL_STORES = [
  { id: 'm1', name: 'Tiya Nena Carinderia', owner: 'Nena Bautista', phone: '+63 917 555 0142', category: 'Food', town: 'Legazpi City', address: 'Rizal St., Legazpi City', permits: ['registration', 'mayors', 'bir', 'sanitary'], status: 'active', commissionPercent: 15, appliedAt: NOW - 50 * DAY, note: '' },
  { id: 'm2', name: 'Daraga Pili Treats', owner: 'Liza Morales', phone: '+63 918 402 7721', category: 'Food', town: 'Daraga', address: 'Brgy. Sagpon, Daraga', permits: ['registration', 'mayors', 'bir'], status: 'active', commissionPercent: 12, appliedAt: NOW - 45 * DAY, note: '' },
  { id: 'm3', name: 'Albay Fresh Mart', owner: 'Rodel Cruz', phone: '+63 919 660 3348', category: 'Grocery', town: 'Legazpi City', address: 'Peñaranda St., Legazpi City', permits: ['registration', 'mayors', 'bir', 'sanitary'], status: 'active', commissionPercent: 10, appliedAt: NOW - 30 * DAY, note: '' },
  { id: 'm4', name: 'Kusina ni Lola Iska', owner: 'Francisca Llagas', phone: '+63 926 771 0045', category: 'Food', town: 'Camalig', address: 'Poblacion, Camalig', permits: ['registration', 'mayors', 'sanitary'], status: 'pending', commissionPercent: null, appliedAt: NOW - 5 * HOUR, note: '' },
  { id: 'm5', name: 'Botika sa Tabaco', owner: 'Gerry Ponce', phone: '+63 939 408 1126', category: 'Pharmacy', town: 'Tabaco City', address: 'Ziga Ave., Tabaco City', permits: ['registration'], status: 'pending', commissionPercent: null, appliedAt: NOW - 2 * DAY, note: '' },
  { id: 'm6', name: 'Bulkan Brew Café', owner: 'Paolo Ricafort', phone: '+63 947 225 9034', category: 'Food', town: 'Legazpi City', address: 'Washington Drive, Legazpi City', permits: ['registration', 'mayors', 'bir'], status: 'suspended', commissionPercent: 15, appliedAt: NOW - 70 * DAY, note: 'Repeated late order preparation.' },
];

export const INITIAL_ORDERS = [
  { id: 'o1', code: 'HN-4821', storeId: 'm1', customer: 'Maria S.', riderId: 'r3', town: 'Legazpi City', subtotal: 250, deliveryFee: 49, status: 'on_the_way', payment: 'Cash on delivery', createdAt: NOW - 12 * MIN },
  { id: 'o2', code: 'HN-4820', storeId: 'm3', customer: 'Liza M.', riderId: null, town: 'Legazpi City', subtotal: 400, deliveryFee: 69, status: 'preparing', payment: 'Cash on delivery', createdAt: NOW - 18 * MIN },
  { id: 'o3', code: 'HN-4818', storeId: 'm2', customer: 'Jun R.', riderId: 'r3', town: 'Daraga', subtotal: 180, deliveryFee: 59, status: 'delivered', payment: 'Cash on delivery', createdAt: NOW - 55 * MIN },
  { id: 'o4', code: 'HN-4815', storeId: 'm1', customer: 'Carlo D.', riderId: 'r4', town: 'Legazpi City', subtotal: 365, deliveryFee: 49, status: 'delivered', payment: 'Cash on delivery', createdAt: NOW - 2 * HOUR },
  { id: 'o5', code: 'HN-4812', storeId: 'm1', customer: 'Ana P.', riderId: null, town: 'Legazpi City', subtotal: 95, deliveryFee: 49, status: 'cancelled', payment: 'Cash on delivery', createdAt: NOW - 3 * HOUR },
  { id: 'o6', code: 'HN-4809', storeId: 'm3', customer: 'Rey B.', riderId: 'r3', town: 'Legazpi City', subtotal: 520, deliveryFee: 69, status: 'delivered', payment: 'Cash on delivery', createdAt: NOW - 4 * HOUR },
  { id: 'o7', code: 'HN-4801', storeId: 'm2', customer: 'Grace T.', riderId: 'r4', town: 'Daraga', subtotal: 300, deliveryFee: 59, status: 'delivered', payment: 'Cash on delivery', createdAt: NOW - 6 * HOUR },
  { id: 'o8', code: 'HN-4790', storeId: 'm1', customer: 'Noel V.', riderId: 'r3', town: 'Legazpi City', subtotal: 190, deliveryFee: 49, status: 'delivered', payment: 'Cash on delivery', createdAt: NOW - 1 * DAY },
];