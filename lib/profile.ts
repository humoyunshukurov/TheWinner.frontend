const PROFILE_INFO_PREFIX = 'nt_profile_info_';
const PROFILE_PHOTO_PREFIX = 'nt_profile_photo_';

export function loadProfile(guestId, fallbackName) {
  const fallback = { firstName: fallbackName || '' };
  if (typeof window === 'undefined' || !guestId) return fallback;

  const raw = localStorage.getItem(PROFILE_INFO_PREFIX + guestId);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveProfile(guestId, profile) {
  if (typeof window === 'undefined' || !guestId) return;
  localStorage.setItem(PROFILE_INFO_PREFIX + guestId, JSON.stringify(profile));
}

export function loadProfilePhoto(guestId) {
  if (typeof window === 'undefined' || !guestId) return null;
  return localStorage.getItem(PROFILE_PHOTO_PREFIX + guestId);
}

export function saveProfilePhoto(guestId, dataUrl) {
  if (typeof window === 'undefined' || !guestId) return;
  localStorage.setItem(PROFILE_PHOTO_PREFIX + guestId, dataUrl);
}

// Username rename moves the guestId, and photo/profile-info are namespaced by
// guestId in localStorage - without this they'd look "lost" on the new name,
// same class of bug as the pre-persistence-fix coin/HP loss.
export function migrateProfileStorage(oldGuestId, newGuestId) {
  if (typeof window === 'undefined' || !oldGuestId || !newGuestId || oldGuestId === newGuestId) return;

  const photo = localStorage.getItem(PROFILE_PHOTO_PREFIX + oldGuestId);
  if (photo) {
    localStorage.setItem(PROFILE_PHOTO_PREFIX + newGuestId, photo);
    localStorage.removeItem(PROFILE_PHOTO_PREFIX + oldGuestId);
  }

  const info = localStorage.getItem(PROFILE_INFO_PREFIX + oldGuestId);
  if (info) {
    localStorage.setItem(PROFILE_INFO_PREFIX + newGuestId, info);
    localStorage.removeItem(PROFILE_INFO_PREFIX + oldGuestId);
  }
}
