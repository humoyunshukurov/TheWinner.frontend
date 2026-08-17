import { useEffect, useState } from 'react';
import { getGuest, GUEST_CHANGED_EVENT } from './guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Whether the current guest belongs to a real (code-joined) group -
// gates "Kod bilan o'yin" (Kahoot-style class sessions only make sense
// for someone who's actually in a class). `loaded` distinguishes "still
// checking" from "confirmed groupless" so a caller can default to the
// locked state while loading instead of flashing unlocked first.
export function useMyGroup() {
  const [group, setGroup] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function load() {
      const { guestId } = getGuest();
      fetch(`${API_URL}/groups/mine?guestId=${guestId}`)
        .then((res) => res.json())
        .then((data) => {
          setGroup(data.group || null);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }

    load();
    window.addEventListener(GUEST_CHANGED_EVENT, load);
    return () => window.removeEventListener(GUEST_CHANGED_EVENT, load);
  }, []);

  return { group, hasGroup: Boolean(group), loaded };
}
