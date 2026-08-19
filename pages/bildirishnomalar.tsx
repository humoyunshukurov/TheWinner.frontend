import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getGuest } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Full page version of what the topbar bell used to show inline: two
// kinds of thing, merged into one reverse-chron feed - (1) taklif
// threads this guest has sent from Sozlamalar, with whatever replies
// have come back, and (2) e'lonlar (announcements) sent to everyone or
// to this guest's group. Never shows who specifically replied/sent it
// (the backend does track that internally, but it's deliberately not
// surfaced here) - every message reads as coming from "ma'muriyat" as a
// whole, not a named person.
export default function BildirishnomalarPage() {
  const [feed, setFeed] = useState<any[] | null>(null);

  useEffect(() => {
    const { guestId } = getGuest();
    Promise.all([
      fetch(`${API_URL}/feedback/mine?guestId=${guestId}`).then((res) => res.json()),
      fetch(`${API_URL}/feedback/announcements?guestId=${guestId}`).then((res) => res.json())
    ])
      .then(([mine, announcements]) => {
        const merged = [
          ...mine.map((entry) => ({ type: 'thread', createdAt: entry.createdAt, entry })),
          ...announcements.map((a) => ({ type: 'announcement', createdAt: a.createdAt, entry: a }))
        ].sort((a, b) => b.createdAt - a.createdAt);
        setFeed(merged);
      })
      .catch(() => setFeed([]));

    fetch(`${API_URL}/feedback/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId })
    }).catch(() => {});
  }, []);

  return (
    <Layout title="Bildirishnomalar" backHref="/">
      <article className="card">
        {!feed && <p className="muted">Yuklanmoqda...</p>}
        {feed?.length === 0 && <p className="muted">Hali hech narsa yo&apos;q. Sozlamalar &rsaquo; Taklif yozish.</p>}

        {feed && feed.length > 0 && (
          <div className="feedback-thread-list">
            {feed.map((item) =>
              item.type === 'announcement' ? (
                <div key={`a${item.entry.id}`} className="feedback-thread-item">
                  <div className="feedback-thread-reply">
                    <p>📢 {item.entry.text}</p>
                    <span className="feedback-thread-time">{formatTime(item.entry.createdAt)}</span>
                  </div>
                </div>
              ) : (
                <div key={`t${item.entry.id}`} className="feedback-thread-item">
                  <div className="feedback-thread-mine">
                    <p>{item.entry.text}</p>
                    <span className="feedback-thread-time">{formatTime(item.entry.createdAt)}</span>
                  </div>
                  {item.entry.replies?.map((reply, i) => (
                    <div key={i} className="feedback-thread-reply">
                      <p>{reply.text}</p>
                      <span className="feedback-thread-time">{formatTime(reply.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </article>
    </Layout>
  );
}
