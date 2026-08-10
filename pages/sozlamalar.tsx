import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { IconEdit, IconCamera, IconShield } from '../components/icons';
import { getGuest, isRegistered, renameAccount } from '../lib/guest';
import { loadProfile, saveProfile as persistProfile, loadProfilePhoto, saveProfilePhoto, migrateProfileStorage } from '../lib/profile';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export default function SozlamalarPage() {
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({ firstName: '' });
  const [draft, setDraft] = useState({ firstName: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [account, setAccount] = useState(null);
  const [renameError, setRenameError] = useState(null);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    const { guestId, name } = getGuest();

    const savedPhoto = loadProfilePhoto(guestId);
    if (savedPhoto) setPhoto(savedPhoto);

    if (isRegistered()) {
      // Registered accounts: "Ism" IS the login username, so it comes
      // straight from the account, not the local-only profile store.
      setAccount({ guestId, name });
      setProfile({ firstName: name });
      setDraft({ firstName: name });
    } else {
      const loadedProfile = loadProfile(guestId, name);
      setProfile(loadedProfile);
      setDraft(loadedProfile);
    }
  }, []);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Faqat JPEG, JPG yoki PNG formatdagi rasm yuklang');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Rasm hajmi 2MB dan oshmasligi kerak");
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      saveProfilePhoto(getGuest().guestId, reader.result);
    };
    reader.readAsDataURL(file);
  }

  function updateDraft(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function startEditProfile() {
    setDraft(profile);
    setRenameError(null);
    setEditingProfile(true);
  }

  function cancelEditProfile() {
    setDraft(profile);
    setRenameError(null);
    setEditingProfile(false);
  }

  async function saveProfile() {
    const newName = (draft.firstName || '').trim();
    if (!newName) {
      setRenameError('Ismni kiriting');
      return;
    }

    if (account) {
      // Ism va Kirish bitta narsa: nomni o'zgartirish backenddagi
      // username'ni ham o'zgartiradi, shu bilan boshqa qurilmadan ham
      // yangi nom bilan kirish mumkin bo'ladi.
      setRenaming(true);
      setRenameError(null);
      const oldGuestId = account.guestId;
      try {
        const data = await renameAccount(newName);
        migrateProfileStorage(oldGuestId, data.guestId);
        setAccount({ guestId: data.guestId, name: data.username });
        setProfile({ firstName: data.username });
        setDraft({ firstName: data.username });
        setEditingProfile(false);
      } catch (err) {
        setRenameError(err.message || 'Xatolik yuz berdi');
      } finally {
        setRenaming(false);
      }
      return;
    }

    setProfile(draft);
    persistProfile(getGuest().guestId, draft);
    setEditingProfile(false);
  }

  return (
    <Layout eyebrow="Ilova sozlamalari" title="Sozlamalar">
      <article className="card">
        <div className="card-header">
          <h3>Shaxsiy ma'lumotlar</h3>
          {!editingProfile && (
            <button className="pill-btn" onClick={startEditProfile}>
              <IconEdit /> Tahrirlash
            </button>
          )}
        </div>

        <div className="profile-photo-row">
          <button
            type="button"
            className="profile-photo-big"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Profil rasmini yuklash"
          >
            {photo ? <img src={photo} alt="Profil rasmi" /> : 'AN'}
            <span className="profile-photo-overlay">
              <IconCamera size={15} />
            </span>
          </button>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            className="visually-hidden"
          />
          <div className="profile-photo-hint">
            {photo && <span className="badge good">Talabga mos</span>}
            <p className="muted">JPEG, JPG, PNG &middot; maksimum 2MB &middot; 500x500 o&apos;lcham</p>
            {photoError && <p className="profile-photo-error">{photoError}</p>}
            <button type="button" className="link-more" onClick={() => fileInputRef.current?.click()}>
              {photo ? "Rasmni o'zgartirish" : 'Rasm yuklash'}
            </button>
          </div>
        </div>

        <div className="profile-field" style={{ maxWidth: 280 }}>
          <span className="muted">Ism{account ? ' (kirish uchun ham shu)' : ''}</span>
          {editingProfile ? (
            <input
              className="form-input"
              value={draft.firstName}
              onChange={(e) => updateDraft('firstName', e.target.value)}
            />
          ) : (
            <strong>{profile.firstName}</strong>
          )}
        </div>

        {editingProfile && renameError && (
          <p className="muted" style={{ color: 'var(--critical)', marginTop: 8, marginBottom: 0 }}>
            {renameError}
          </p>
        )}

        {editingProfile && (
          <div className="action-row" style={{ marginTop: 18 }}>
            <button className="pill-btn primary" onClick={saveProfile} disabled={renaming}>
              {renaming ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button className="pill-btn" onClick={cancelEditProfile} disabled={renaming}>
              Bekor qilish
            </button>
          </div>
        )}

        {account && (
          <>
            <div style={{ borderTop: '1px solid var(--card-border)', margin: '24px 0 18px' }} />

            <div className="card-header">
              <h3>Hisob xavfsizligi</h3>
              <IconShield size={18} />
            </div>

            <div className="profile-fields-grid">
              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="muted">Parol</span>
                  <strong className="password-dots">••••••••</strong>
                </div>
              </div>
            </div>

            <p className="muted" style={{ fontSize: '0.78rem', marginTop: 14, marginBottom: 0 }}>
              Kirish uchun login - yuqoridagi Ism. Ismni o&apos;zgartirsangiz, boshqa qurilmadan shu yangi ism va parol bilan kirasiz.
            </p>
          </>
        )}
      </article>
    </Layout>
  );
}
