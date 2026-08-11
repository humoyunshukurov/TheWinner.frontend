import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { IconEdit, IconCamera, IconShield, IconEye, IconEyeOff } from '../components/icons';
import { getGuest, isRegistered, updateAccount, getStoredPassword, loginAccount } from '../lib/guest';
import { loadProfile, saveProfile as persistProfile, loadProfilePhoto, saveProfilePhoto, migrateProfileStorage } from '../lib/profile';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

function PasswordInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input-wrap">
      <input
        className="form-input"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Parolni yashirish' : "Parolni ko'rsatish"}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

export default function SozlamalarPage() {
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({ firstName: '' });
  const [draft, setDraft] = useState({ firstName: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [account, setAccount] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [renameError, setRenameError] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [storedPassword, setStoredPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [revealPromptOpen, setRevealPromptOpen] = useState(false);
  const [revealPromptValue, setRevealPromptValue] = useState('');
  const [revealPromptError, setRevealPromptError] = useState(null);
  const [revealPromptBusy, setRevealPromptBusy] = useState(false);

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
      setStoredPassword(getStoredPassword());
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

  function togglePasswordReveal() {
    if (showPassword) {
      setShowPassword(false);
      return;
    }
    if (storedPassword) {
      setShowPassword(true);
      return;
    }
    // This device never captured the plaintext password (e.g. it logged
    // in before this feature shipped, or on another device) - the hash
    // on the backend can't be reversed, so the only way to show it is to
    // ask for it once and verify via the existing login call, which also
    // caches it locally for next time.
    setRevealPromptError(null);
    setRevealPromptValue('');
    setRevealPromptOpen(true);
  }

  async function confirmPasswordReveal() {
    if (!revealPromptValue) return;
    setRevealPromptBusy(true);
    setRevealPromptError(null);
    try {
      await loginAccount(account.name, revealPromptValue);
      setStoredPassword(getStoredPassword());
      setShowPassword(true);
      setRevealPromptOpen(false);
      setRevealPromptValue('');
    } catch (err) {
      setRevealPromptError(err.message || 'Xatolik yuz berdi');
    } finally {
      setRevealPromptBusy(false);
    }
  }

  function startEditProfile() {
    setDraft(profile);
    setCurrentPassword('');
    setNewPassword('');
    setRenameError(null);
    setEditingProfile(true);
  }

  function cancelEditProfile() {
    setDraft(profile);
    setCurrentPassword('');
    setNewPassword('');
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
      // Ism va Kirish bitta narsa, shu bilan birga bu yerdan parolni ham
      // o'zgartirish mumkin - shu sabab har qanday saqlashda joriy
      // parolni tasdiqlash talab qilinadi (faqat username bilib account
      // egallab olinmasin uchun).
      if (!currentPassword) {
        setRenameError('Joriy parolni kiriting');
        return;
      }

      setRenaming(true);
      setRenameError(null);
      const oldGuestId = account.guestId;
      try {
        const data = await updateAccount({
          currentPassword,
          newUsername: newName,
          newPassword: newPassword || undefined
        });
        migrateProfileStorage(oldGuestId, data.guestId);
        setAccount({ guestId: data.guestId, name: data.username });
        setProfile({ firstName: data.username });
        setDraft({ firstName: data.username });
        setStoredPassword(getStoredPassword());
        setShowPassword(false);
        setCurrentPassword('');
        setNewPassword('');
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

        {account && (
          <>
            <div style={{ borderTop: '1px solid var(--card-border)', margin: '24px 0 18px' }} />

            <div className="card-header">
              <h3>Hisob xavfsizligi</h3>
              <IconShield size={18} />
            </div>

            {editingProfile ? (
              <div className="profile-fields-grid">
                <div className="profile-field">
                  <span className="muted">Joriy parol</span>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Joriy parolingiz"
                  />
                </div>
                <div className="profile-field">
                  <span className="muted">Yangi parol</span>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="O'zgartirmasa bo'sh qoldiring"
                  />
                </div>
              </div>
            ) : (
              <div className="profile-fields-grid">
                <div className="settings-row">
                  <div className="settings-row-info">
                    <span className="muted">Parol</span>
                    <strong className={showPassword ? '' : 'password-dots'}>
                      {showPassword && storedPassword ? storedPassword : '••••••••'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="icon-edit-btn"
                    onClick={togglePasswordReveal}
                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>

                {revealPromptOpen && (
                  <div className="password-reveal-prompt">
                    <PasswordInput
                      value={revealPromptValue}
                      onChange={(e) => setRevealPromptValue(e.target.value)}
                      placeholder="Ko'rish uchun joriy parolni kiriting"
                    />
                    {revealPromptError && <p className="profile-photo-error">{revealPromptError}</p>}
                    <div className="action-row" style={{ marginTop: 10 }}>
                      <button
                        className="pill-btn primary"
                        onClick={confirmPasswordReveal}
                        disabled={revealPromptBusy || !revealPromptValue}
                      >
                        {revealPromptBusy ? 'Tekshirilmoqda...' : "Ko'rsatish"}
                      </button>
                      <button className="pill-btn" onClick={() => setRevealPromptOpen(false)} disabled={revealPromptBusy}>
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {editingProfile && renameError && (
          <p className="muted" style={{ color: 'var(--critical)', marginTop: 14, marginBottom: 0 }}>
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
      </article>
    </Layout>
  );
}
