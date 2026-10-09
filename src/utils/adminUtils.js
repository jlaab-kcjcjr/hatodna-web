export { timeAgo as ago } from './format';

// What HatodNa earns from one order: store commission + its share of the delivery fee + service fee.
// These amounts are calculated and saved by the database when the order is placed.
export function platformRevenue(order) {
  if (order.status === 'cancelled' || order.status === 'declined') return 0;
  return (
    Number(order.commission_amount) +
    Number(order.delivery_fee) -
    Number(order.rider_earning) +
    Number(order.service_fee)
  );
}

// Phone logins are saved like "639171234567"; show them as "+639171234567".
export function formatPhone(phone) {
  if (!phone) return 'Not provided';
  return phone.startsWith('+') ? phone : `+${phone}`;
}