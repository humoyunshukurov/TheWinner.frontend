import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconBell } from './icons';
import { getGuest, GUEST_CHANGED_EVENT } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const UNREAD_POLL_MS = 15000;

// Topbar bell - just an unread badge that navigates to /bildirishnomalar
// (the full feed lives there now, not in an inline dropdown here).
export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function loadUnreadCount() {
      const { guestId } = getGuest();
      fetch(`${API_URL}/feedback/unread-count?guestId=${guestId}`)
        .then((res) => res.json())
        .then((data) => setUnreadCount(data.count || 0))
        .catch(() => {});
    }

    loadUnreadCount();
    const id = setInterval(loadUnreadCount, UNREAD_POLL_MS);
    window.addEventListener(GUEST_CHANGED_EVENT, loadUnreadCount);
    return () => {
      clearInterval(id);
      window.removeEventListener(GUEST_CHANGED_EVENT, loadUnreadCount);
    };
  }, []);

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={() => router.push('/bildirishnomalar')}
      aria-label="Bildirishnomalar"
      title="Bildirishnomalar"
    >
      <IconBell size={17} />
      {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
  );
}
