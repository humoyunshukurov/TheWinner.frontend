const ID_KEY = 'nt_guest_id';
const NAME_KEY = 'nt_guest_name';
const REGISTERED_KEY = 'nt_registered';
// Passwords aren't hash-reversible on the backend, so "let the user see
// their password" only works by remembering what was typed on this same
// device at the last successful register/login/rename - see Sozlamalar's
// eye-icon toggle on the Parol row.
const PASSWORD_KEY = 'nt_guest_password';
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

export function getStoredPassword() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(PASSWORD_KEY) || '';
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(REGISTERED_KEY);
  localStorage.removeItem(PASSWORD_KEY);
  window.dispatchEvent(new Event(GUEST_CHANGED_EVENT));
}

function persistIdentity(guestId, username, password) {
  localStorage.setItem(ID_KEY, guestId);
  localStorage.setItem(NAME_KEY, username);
  localStorage.setItem(REGISTERED_KEY, '1');
  if (password) localStorage.setItem(PASSWORD_KEY, password);
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
  persistIdentity(data.guestId, data.username, password);
  return data;
}

export function registerAccount(username, password) {
  return callAuth('register', username, password);
}

export function loginAccount(username, password) {
  return callAuth('login', username, password);
}

export async function updateAccount({ currentPassword, newUsername, newPassword }) {
  const { guestId } = getGuest();
  const res = await fetch(`${API_URL}/auth/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, currentPassword, newUsername, newPassword })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  persistIdentity(data.guestId, data.username, newPassword || currentPassword);
  return data;
}
