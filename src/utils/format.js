export const peso = (amount) => `₱${Number(amount).toLocaleString('en-PH')}`;

export function timeAgo(timestamp) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

export const isToday = (timestamp) => new Date(timestamp).toDateString() === new Date().toDateString();

// Bikol greetings based on the time of day.
export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Marhay na aga';
  if (hour < 18) return 'Marhay na hapon';
  return 'Marhay na banggi';
}