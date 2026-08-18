import { useEffect, useRef, useState } from 'react';
import { IconBell } from './icons';
import { getGuest, GUEST_CHANGED_EVENT } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const UNREAD_POLL_MS = 15000;

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Topbar bell, fully in-app: two kinds of thing show up here - (1) taklif
// threads this guest has sent from Sozlamalar, with whatever replies have
// come back, and (2) e'lonlar (announcements) the super admin broadcast to
// everyone or to this guest's group. Merged into one reverse-chron feed so
// "Bildirishnomalar" really is a single place everything lands, not two
// separate lists.
export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<any[] | null>(null);
  const guestRef = useRef({ guestId: '' });

  function loadUnreadCount() {
    const { guestId } = getGuest();
    guestRef.current = { guestId };
    fetch(`${API_URL}/feedback/unread-count?guestId=${guestId}`)
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.count || 0))
      .catch(() => {});
  }

  useEffect(() => {
    loadUnreadCount();
    const id = setInterval(loadUnreadCount, UNREAD_POLL_MS);
    window.addEventListener(GUEST_CHANGED_EVENT, loadUnreadCount);
    return () => {
      clearInterval(id);
      window.removeEventListener(GUEST_CHANGED_EVENT, loadUnreadCount);
    };
  }, []);

  function togglePanel() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const { guestId } = guestRef.current;
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
          .catch(() => {});
        // Opening the panel counts as "seen" - clears the badge right
        // away instead of waiting for the next poll.
        fetch(`${API_URL}/feedback/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestId })
        })
          .then(() => setUnreadCount(0))
          .catch(() => {});
      }
      return next;
    });
  }

  return (
    <div className="feedback-bell-wrap">
      <button type="button" className="theme-toggle-btn" onClick={togglePanel} aria-label="Bildirishnomalar" title="Bildirishnomalar">
        <IconBell size={17} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className="feedback-bell-scrim" onClick={() => setOpen(false)} />
          <div className="feedback-bell-dropdown">
            <div className="feedback-bell-header">
              <strong>Bildirishnomalar</strong>
            </div>
            <div className="feedback-thread-list">
              {!feed && <p className="muted">Yuklanmoqda...</p>}
              {feed?.length === 0 && <p className="muted">Hali hech narsa yo&apos;q. Sozlamalar &rsaquo; Taklif yozish.</p>}
              {feed?.map((item) =>
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
          </div>
        </>
      )}
    </div>
  );
}
