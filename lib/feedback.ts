const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Asks the backend for a one-time Telegram "ulash" deep-link tied to this
// guest's identity (name + guestId). Opening it is how a taklif actually
// gets written - nothing is typed on the site itself, the link just hands
// the bot enough context (via its /start payload) to know who's writing
// without asking them to type their name/role by hand.
export async function requestTelegramFeedbackLink(guestId: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/feedback/telegram-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, name })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  return data.deepLink;
}
