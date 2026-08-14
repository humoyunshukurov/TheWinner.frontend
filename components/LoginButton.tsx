import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconLogin } from './icons';
import { isRegistered, GUEST_CHANGED_EVENT } from '../lib/guest';

// The mirror image of LogoutButton - visible only while browsing
// anonymously, everywhere in the app (not just the moment a game/test
// forces the "Davom etishdan oldin" gate). A guest who wants to log in
// or register shouldn't have to go start a game first to find the door.
export default function LoginButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [registered, setRegistered] = useState(true);

  useEffect(() => {
    function refresh() {
      setRegistered(isRegistered());
    }
    refresh();
    window.addEventListener(GUEST_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(GUEST_CHANGED_EVENT, refresh);
  }, [router.pathname]);

  if (registered) return null;

  return (
    <button
      type="button"
      className={compact ? 'theme-toggle-btn' : 'pill-btn login-btn'}
      onClick={() => router.push(`/kirish?redirect=${encodeURIComponent(router.asPath)}`)}
      aria-label="Hisobga kirish"
      title="Hisobga kirish"
    >
      <IconLogin size={compact ? 17 : undefined} />
      {!compact && ' Kirish'}
    </button>
  );
}
