import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { IconEdit, IconCamera, IconShield, IconLogout } from '../components/icons';
import { getGuest, isRegistered, logout } from '../lib/guest';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const PROFILE_STORAGE_KEY = 'nt_profile_info';

const DEFAULT_PROFILE = {
  firstName: 'Azizbek',
  lastName: 'Nurmatov',
  phone: "(+998) 90 123 45 67",
  birthDate: '',
  gender: 'Erkak',
  studentId: 'NT-24831'
};

export default function SozlamalarPage() {
  const router = useRouter();
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const savedPhoto = localStorage.getItem('nt_profile_photo');
    if (savedPhoto) setPhoto(savedPhoto);

    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setDraft(parsed);
    }

    if (isRegistered()) {
      setAccount(getGuest());
    }
  }, []);

  function handleLogout() {
    logout();
    router.push('/');
  }

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
      localStorage.setItem('nt_profile_photo', reader.result);
    };
    reader.readAsDataURL(file);
  }

  function updateDraft(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function startEditProfile() {
    setDraft(profile);
    setEditingProfile(true);
  }

  function cancelEditProfile() {
    setDraft(profile);
    setEditingProfile(false);
  }

  function saveProfile() {
    setProfile(draft);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(draft));
    setEditingProfile(false);
  }

  return (
    <Layout eyebrow="Ilova sozlamalari" title="Sozlamalar">
      <article className="card profile-settings-card">
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

        <div className="profile-fields-grid">
          <div className="profile-field">
            <span className="muted">Ism</span>
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

          <div className="profile-field">
            <span className="muted">Familiya</span>
            {editingProfile ? (
              <input
                className="form-input"
                value={draft.lastName}
                onChange={(e) => updateDraft('lastName', e.target.value)}
              />
            ) : (
              <strong>{profile.lastName}</strong>
            )}
          </div>

          <div className="profile-field">
            <span className="muted">Telefon raqam</span>
            {editingProfile ? (
              <input className="form-input" value={draft.phone} onChange={(e) => updateDraft('phone', e.target.value)} />
            ) : (
              <strong>{profile.phone}</strong>
            )}
          </div>

          <div className="profile-field">
            <span className="muted">Tug&apos;ilgan sana</span>
            {editingProfile ? (
              <input
                type="date"
                className="form-input"
                value={draft.birthDate}
                onChange={(e) => updateDraft('birthDate', e.target.value)}
              />
            ) : (
              <strong>{profile.birthDate || '—'}</strong>
            )}
          </div>

          <div className="profile-field">
            <span className="muted">Jinsi</span>
            {editingProfile ? (
              <select className="form-input" value={draft.gender} onChange={(e) => updateDraft('gender', e.target.value)}>
                <option value="Erkak">Erkak</option>
                <option value="Ayol">Ayol</option>
              </select>
            ) : (
              <strong>{profile.gender}</strong>
            )}
          </div>

          <div className="profile-field">
            <span className="muted">Talaba ID</span>
            <strong>{profile.studentId}</strong>
          </div>
        </div>

        {editingProfile && (
          <div className="action-row" style={{ marginTop: 18 }}>
            <button className="pill-btn primary" onClick={saveProfile}>
              Saqlash
            </button>
            <button className="pill-btn" onClick={cancelEditProfile}>
              Bekor qilish
            </button>
          </div>
        )}
      </article>

      {account && (
        <article className="card" style={{ marginTop: 14 }}>
          <div className="card-header">
            <h3>
              <IconShield size={18} /> Hisob
            </h3>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <strong>Foydalanuvchi nomi</strong>
              <span className="muted">{account.name}</span>
            </div>
          </div>
          <button className="pill-btn logout-btn" onClick={handleLogout}>
            <IconLogout /> Hisobdan chiqish
          </button>
        </article>
      )}
    </Layout>
  );
}
