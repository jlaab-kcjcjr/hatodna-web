// Demo data. Later, all of this comes from the backend.

export const DEMO_LOGIN = { email: 'tiyanena@hatodna.ph', password: 'hatodna123' };

export const INITIAL_STORE = {
  id: 's1',
  name: 'Tiya Nena Carinderia',
  owner: 'Nena Bautista',
  phone: '+63 917 555 0142',
  address: 'Rizal St., Legazpi City',
  prepMinutes: 20,
  isOpen: true,
  hours: [
    { day: 'Monday', open: '07:00', close: '20:00', closed: false },
    { day: 'Tuesday', open: '07:00', close: '20:00', closed: false },
    { day: 'Wednesday', open: '07:00', close: '20:00', closed: false },
    { day: 'Thursday', open: '07:00', close: '20:00', closed: false },
    { day: 'Friday', open: '07:00', close: '21:00', closed: false },
    { day: 'Saturday', open: '07:00', close: '21:00', closed: false },
    { day: 'Sunday', open: '08:00', close: '18:00', closed: false },
  ],
};

export const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'Bicol Express with rice', price: 95, category: 'Ulam', description: 'Pork simmered in coconut milk and siling labuyo.', image: '', available: true },
  { id: 'p2', name: 'Laing with rice', price: 85, category: 'Ulam', description: 'Taro leaves slow-cooked in gata.', image: '', available: true },
  { id: 'p3', name: 'Pinangat (2 pcs)', price: 70, category: 'Ulam', description: 'Gabi leaves wrapped around shrimp and coconut.', image: '', available: true },
  { id: 'p4', name: 'Kinunot na pagi', price: 110, category: 'Ulam', description: 'Flaked stingray in coconut milk with malunggay.', image: '', available: true },
  { id: 'p5', name: 'Turon (3 pcs)', price: 45, category: 'Snacks', description: 'Saba and langka in crispy wrapper.', image: '', available: true },
  { id: 'p6', name: 'Sili ice cream', price: 60, category: 'Desserts', description: 'Sweet, creamy, with a chili kick.', image: '', available: true },
  { id: 'p7', name: 'Buko juice', price: 40, category: 'Drinks', description: 'Fresh young coconut water.', image: '', available: true },
  { id: 'p8', name: 'Calamansi juice', price: 35, category: 'Drinks', description: 'Freshly squeezed, lightly sweetened.', image: '', available: false },
];

export const SAMPLE_CUSTOMERS = [
  { name: 'Maria S.', address: 'Brgy. Bitano, Legazpi City', note: 'Extra rice please' },
  { name: 'Jun R.', address: 'Brgy. Rawis, Legazpi City', note: '' },
  { name: 'Liza M.', address: 'Brgy. Bonot, Legazpi City', note: 'Less spicy po' },
  { name: 'Carlo D.', address: 'Brgy. Sagpon, Daraga', note: '' },
];