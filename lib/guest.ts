const ID_KEY = 'nt_guest_id';
const NAME_KEY = 'nt_guest_name';
const REGISTERED_KEY = 'nt_registered';
export const GUEST_CHANGED_EVENT = 'nt-guest-changed';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(REGISTERED_KEY);
  window.dispatchEvent(new Event(GUEST_CHANGED_EVENT));
}

function persistIdentity(guestId, username) {
  localStorage.setItem(ID_KEY, guestId);
  localStorage.setItem(NAME_KEY, username);
  localStorage.setItem(REGISTERED_KEY, '1');
  window.dispatchEvent(new Event(GUEST_CHANGED_EVENT));
}

async function callAuth(path, username, password) {
  const res = await fetch(`${API_URL}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  persistIdentity(data.guestId, data.username);
  return data;
}

export function registerAccount(username, password) {
  return callAuth('register', username, password);
}

export function loginAccount(username, password) {
  return callAuth('login', username, password);
}

export async function renameAccount(newUsername) {
  const { guestId } = getGuest();
  const res = await fetch(`${API_URL}/auth/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, newUsername })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  persistIdentity(data.guestId, data.username);
  return data;
}
