export const peso = (amount) =>
  `₱${Number(amount || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

// Accepts both numbers (milliseconds) and database dates like "2026-10-09T10:30:00Z".
const toMs = (time) => (typeof time === 'number' ? time : new Date(time).getTime());

export function timeAgo(time) {
  const minutes = Math.floor((Date.now() - toMs(time)) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export const isToday = (time) => new Date(toMs(time)).toDateString() === new Date().toDateString();

// Bikol greetings based on the time of day.
export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Marhay na aga';
  if (hour < 18) return 'Marhay na hapon';
  return 'Marhay na banggi';
}