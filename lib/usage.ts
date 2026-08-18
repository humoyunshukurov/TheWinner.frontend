const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Server-authoritative now - the old version tracked this purely in
// localStorage, which meant two tabs/devices for the same guest counted
// independently (or diverged after a cache clear), showing an
// inconsistent, "random-looking" total. The server keeps the real
// number; this is just a thin client for it.
export function pingUsage(guestId: string, ms: number) {
  if (!guestId || ms <= 0) return;
  fetch(`${API_URL}/usage/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, ms })
  }).catch(() => {});
}

export function fetchUsage(guestId: string): Promise<{ todayMs: number; totalMs: number }> {
  return fetch(`${API_URL}/usage?guestId=${guestId}`)
    .then((res) => res.json())
    .catch(() => ({ todayMs: 0, totalMs: 0 }));
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

// HH:MM:SS for the live session stopwatch - always shows all three
// units (even "00:00:07") since it's meant to visibly tick, not just
// summarize like formatUsageDuration above.
export function formatStopwatch(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
