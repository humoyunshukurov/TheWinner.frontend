const PROFILE_INFO_PREFIX = 'nt_profile_info_';
const PROFILE_PHOTO_PREFIX = 'nt_profile_photo_';
// So Layout.tsx's topbar avatar badge can pick up a photo change made on
// Sozlamalar without a full page reload.
export const PROFILE_PHOTO_CHANGED_EVENT = 'nt-profile-photo-changed';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Shrinks an uploaded photo to avatar size before it ever leaves the device -
// a raw upload can be up to 2MB, but every place it's shown is a ~30-40px
// circle, and the backend now has to store one of these per user and
// re-serialize all of them on every autosave. A preset avatar (a static
// /avatars/... path, not a data: URL) is passed through unchanged since
// there's nothing to shrink.
export function resizeImageDataUrl(dataUrl: string, maxDim = 200, quality = 0.75): Promise<string> {
  if (!dataUrl.startsWith('data:')) return Promise.resolve(dataUrl);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height >= width && height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Rasmni oʻqib boʻlmadi'));
    img.src = dataUrl;
  });
}

// Photos used to be localStorage-only, so nobody could ever see anyone
// else's - this pushes it to the backend too so leaderboards can show real
// avatars for every player. Best-effort: the local copy (localStorage,
// already saved by the caller) is what actually drives this device's UI,
// so a failed sync just means other people won't see the new photo yet.
export function syncProfilePhotoToServer(guestId, photo) {
  if (!guestId || !photo) return;
  fetch(`${API_URL}/profile/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, photo })
  }).catch(() => {});
}

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
  window.dispatchEvent(new Event(PROFILE_PHOTO_CHANGED_EVENT));
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
