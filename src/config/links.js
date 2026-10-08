// Addresses of the other HatodNa websites.
// After deploying on Vercel, set the real addresses as environment variables
// (VITE_CUSTOMER_URL and VITE_RIDER_URL), or replace the fallback values below.
export const LINKS = {
  customer: import.meta.env.VITE_CUSTOMER_URL || 'https://hatodna.vercel.app',
  rider: import.meta.env.VITE_RIDER_URL || 'https://hatodna-rider.vercel.app',
  email: 'jlaabdevstudio@gmail.com',
};