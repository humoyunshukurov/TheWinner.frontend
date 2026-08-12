import { IconUser } from './icons';

// Reusable circular avatar: shows a real photo when one is known, else a
// plain silhouette placeholder. The caller decides what `photo` is - for
// the viewer's own row that's usually the local copy (lib/profile.ts,
// instant/no network round-trip); for anyone else it's whatever the
// backend returned for that guestId (lib/profile.ts's
// syncProfilePhotoToServer is what gets it there in the first place). A
// user who's never set a photo has none to show either way, hence the
// placeholder fallback.
export default function Avatar({ photo, size = 40, className = '' }) {
  return (
    <div className={`avatar-circle ${className}`} style={{ width: size, height: size, minWidth: size }}>
      {photo ? <img src={photo} alt="" /> : <IconUser size={Math.round(size * 0.55)} />}
    </div>
  );
}
