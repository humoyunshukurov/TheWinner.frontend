const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Mirrors the backend's USAGE_SECTIONS list by hand (short, stable set).
export const SECTION_LABELS: Record<string, string> = {
  bosh: 'Bosh sahifa',
  testlar: 'Testlar',
  oyin: "O'yin",
  reyting: 'Reyting',
  guruhlar: 'Guruhlar',
  tarix: 'Tarix',
  sozlamalar: 'Sozlamalar',
  boshqa: 'Boshqa'
};

export function sectionForPath(pathname: string): string {
  if (pathname === '/') return 'bosh';
  if (pathname.startsWith('/testlar')) return 'testlar';
  if (pathname.startsWith('/oyin')) return 'oyin';
  if (pathname.startsWith('/reyting')) return 'reyting';
  if (pathname.startsWith('/guruhlar')) return 'guruhlar';
  if (pathname.startsWith('/tarix')) return 'tarix';
  if (pathname.startsWith('/sozlamalar')) return 'sozlamalar';
  return 'boshqa';
}

// Server-authoritative now - the old version tracked this purely in
// localStorage, which meant two tabs/devices for the same guest counted
// independently (or diverged after a cache clear), showing an
// inconsistent, "random-looking" total. The server keeps the real
// number (and which section it was earned in); this is just a thin
// client for it.
export function pingUsage(guestId: string, ms: number, section: string) {
  if (!guestId || ms <= 0) return;
  fetch(`${API_URL}/usage/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, ms, section })
  }).catch(() => {});
}

export type UsageStats = {
  todayMs: number;
  totalMs: number;
  todayBySection: Record<string, number>;
  totalBySection: Record<string, number>;
};

const EMPTY_USAGE: UsageStats = { todayMs: 0, totalMs: 0, todayBySection: {}, totalBySection: {} };

export function fetchUsage(guestId: string): Promise<UsageStats> {
  return fetch(`${API_URL}/usage?guestId=${guestId}`)
    .then((res) => res.json())
    .catch(() => EMPTY_USAGE);
}

export function formatUsageDuration(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);

  if (totalMinutes < 1) return 'Hozir boshladingiz';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} daqiqa`;
  if (minutes === 0) return `${hours} soat`;
  return `${hours} soat ${minutes} daqiqa`;
}
