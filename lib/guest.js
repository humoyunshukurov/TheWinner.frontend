const ID_KEY = 'nt_guest_id';
const NAME_KEY = 'nt_guest_name';
const REGISTERED_KEY = 'nt_registered';
export const GUEST_CHANGED_EVENT = 'nt-guest-changed';

export function getGuest() {
  if (typeof window === 'undefined') return { guestId: '', name: '' };

  let guestId = localStorage.getItem(ID_KEY);
  let name = localStorage.getItem(NAME_KEY);

  if (!guestId) {
    guestId = `g_${Math.random().toString(36).slice(2, 10)}`;
    name = `O'yinchi ${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(ID_KEY, guestId);
    localStorage.setItem(NAME_KEY, name);
  }

  return { guestId, name };
}

export function isRegistered() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REGISTERED_KEY) === '1';
}

function slugifyName(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_]/gu, '');
  return slug || 'user';
}

export function registerGuest(name, code) {
  const trimmedName = name.trim();
  const guestId = `${slugifyName(trimmedName)}_${code}`;

  localStorage.setItem(ID_KEY, guestId);
  localStorage.setItem(NAME_KEY, trimmedName);
  localStorage.setItem(REGISTERED_KEY, '1');
  window.dispatchEvent(new Event(GUEST_CHANGED_EVENT));

  return { guestId, name: trimmedName };
}
