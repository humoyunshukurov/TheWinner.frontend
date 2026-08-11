import { IconUser } from './icons';

// Reusable circular avatar: shows a real photo when one is known, else a
// plain silhouette placeholder. Other users' photos never leave their own
// browser (they're stored in localStorage, not synced to the backend), so
// this only ever has a real `photo` to show for the current device's own
// account - everyone else always falls back to the placeholder, which is
// the honest state rather than faking a picture we don't actually have.
export default function Avatar({ photo, size = 40, className = '' }) {
  return (
    <div className={`avatar-circle ${className}`} style={{ width: size, height: size, minWidth: size }}>
      {photo ? <img src={photo} alt="" /> : <IconUser size={Math.round(size * 0.55)} />}
    </div>
  );
}
