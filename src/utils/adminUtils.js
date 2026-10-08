// How much HatodNa earns from one order: store commission + its share of the delivery fee + service fee.
export function platformRevenue(order, store, settings) {
  if (order.status === 'cancelled') return 0;
  const commissionPercent = store?.commissionPercent ?? settings.defaultCommissionPercent;
  const commission = Math.round((order.subtotal * commissionPercent) / 100);
  const deliveryCut = Math.round((order.deliveryFee * (100 - settings.riderSharePercent)) / 100);
  return commission + deliveryCut + settings.serviceFee;
}

export function ago(timestamp) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}