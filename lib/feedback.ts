const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Writes a taklif straight into the app - no external bot involved. It
// lands in the super admin's Bildirishnomalar inbox immediately, and any
// reply shows up back here the next time this guest's own notification
// bell polls (see NotificationBell.tsx).
export async function submitFeedback(guestId: string, name: string, text: string) {
  const res = await fetch(`${API_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, name, text })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  return data;
}
