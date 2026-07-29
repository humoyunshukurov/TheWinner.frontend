const STORAGE_KEY = 'nt_usage_ms';

export function getTotalUsageMs() {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(STORAGE_KEY) || 0);
}

export function addUsageMs(ms) {
  if (typeof window === 'undefined') return 0;
  const total = getTotalUsageMs() + ms;
  localStorage.setItem(STORAGE_KEY, String(total));
  return total;
}

export function formatUsageDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);

  if (totalMinutes < 1) return 'Hozir boshladingiz';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} daqiqa`;
  if (minutes === 0) return `${hours} soat`;
  return `${hours} soat ${minutes} daqiqa`;
}
