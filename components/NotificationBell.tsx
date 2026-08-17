import { useEffect, useRef, useState } from 'react';
import { IconBell } from './icons';
import { getGuest, GUEST_CHANGED_EVENT } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const UNREAD_POLL_MS = 15000;

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Topbar bell for replies to takliflar this guest has sent (see Sozlamalar's
// "Telegram orqali yozish") - a reply normally reaches them via Telegram
// already, this is just a second, in-app way to notice it, especially for
// anyone who hasn't connected their Telegram at all. Opens a small dropdown
// showing every taklif they've sent with whatever replies have come back,
// styled as a mini chat thread per entry.
export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[] | null>(null);
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
        fetch(`${API_URL}/feedback/mine?guestId=${guestId}`)
          .then((res) => res.json())
          .then(setItems)
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
              {!items && <p className="muted">Yuklanmoqda...</p>}
              {items?.length === 0 && (
                <p className="muted">Hali taklif yubormagansiz. Sozlamalar &rsaquo; Telegram orqali yozish.</p>
              )}
              {items?.map((entry) => (
                <div key={entry.id} className="feedback-thread-item">
                  <div className="feedback-thread-mine">
                    <p>{entry.text}</p>
                    <span className="feedback-thread-time">{formatTime(entry.createdAt)}</span>
                  </div>
                  {entry.replies?.map((reply, i) => (
                    <div key={i} className="feedback-thread-reply">
                      <p>{reply.text}</p>
                      <span className="feedback-thread-time">{formatTime(reply.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
