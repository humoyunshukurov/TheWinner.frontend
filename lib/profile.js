export const PROFILE_STORAGE_KEY = 'nt_profile_info';

export const DEFAULT_PROFILE = {
  firstName: 'Azizbek'
};

export function setProfileName(name) {
  if (typeof window === 'undefined' || !name) return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ firstName: name }));
}
