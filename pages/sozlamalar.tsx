import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PasswordInput from '../components/PasswordInput';
import { IconEdit, IconCamera, IconEye, IconEyeOff, IconSend } from '../components/icons';
import { getGuest, isRegistered, updateAccount, getStoredPassword, loginAccount, deleteAccount } from '../lib/guest';
import { submitFeedback } from '../lib/feedback';
import {
  loadProfile,
  saveProfile as persistProfile,
  loadProfilePhoto,
  saveProfilePhoto,
  migrateProfileStorage,
  resizeImageDataUrl,
  syncProfilePhotoToServer
} from '../lib/profile';
import { PRESET_AVATARS } from '../lib/avatars';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];


function EditIconButton({ onClick }) {
  return (
    <button type="button" className="icon-edit-btn" onClick={onClick} aria-label="Tahrirlash" title="Tahrirlash">
      <IconEdit size={15} />
    </button>
  );
}

export default function SozlamalarPage() {
  const router = useRouter();
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
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
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function sendFeedback() {
    const text = feedbackText.trim();
    if (!text) return;

    setFeedbackSending(true);
    setFeedbackError(null);
    setFeedbackSent(false);
    try {
      const { guestId, name } = getGuest();
      await submitFeedback(guestId, profile.firstName || name, text);
      setFeedbackText('');
      setFeedbackSent(true);
    } catch (err) {
      setFeedbackError(err.message || 'Xatolik yuz berdi');
    } finally {
      setFeedbackSending(false);
    }
  }

  function openDeleteConfirm() {
    setDeletePassword('');
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteAccount() {
    if (!deletePassword) {
      setDeleteError('Joriy parolni kiriting');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
      router.push('/');
    } catch (err) {
      setDeleteError(err.message || 'Xatolik yuz berdi');
      setDeleting(false);
    }
  }

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
    reader.onload = () => applyOrConfirmPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function chooseAvatar(src) {
    if (photo === src) return;
    setPhotoError(null);
    applyOrConfirmPhoto(src);
  }

  // A preset avatar and an uploaded photo are stored the same way - just
  // an <img src> (a static path or a data: URL) - so replacing either one
  // goes through the same confirm step.
  function applyOrConfirmPhoto(src) {
    if (photo) {
      setPendingPhoto(src);
    } else {
      applyPhoto(src);
    }
  }

  function applyPhoto(src) {
    resizeImageDataUrl(src)
      .catch(() => src)
      .then((finalSrc) => {
        const { guestId } = getGuest();
        setPhoto(finalSrc);
        saveProfilePhoto(guestId, finalSrc);
        syncProfilePhotoToServer(guestId, finalSrc);
      });
  }

  function confirmPhotoChange() {
    if (pendingPhoto) applyPhoto(pendingPhoto);
    setPendingPhoto(null);
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
    <Layout title="Sozlamalar">
      <div className="settings-page-grid">
        <article className="card" style={!account ? { gridColumn: '1 / -1' } : undefined}>
          <div className="card-header">
            <h3>Shaxsiy ma'lumotlar</h3>
            {!editingProfile && <EditIconButton onClick={startEditProfile} />}
          </div>

          <div className="profile-photo-row">
            {editingProfile ? (
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
            ) : (
              <div className="profile-photo-big" style={{ cursor: 'default' }}>
                {photo ? <img src={photo} alt="Profil rasmi" /> : 'AN'}
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="visually-hidden"
            />
            {editingProfile && (
              <div className="profile-photo-hint">
                {photo && <span className="badge good">Talabga mos</span>}
                <p className="muted">JPEG, JPG, PNG &middot; maksimum 2MB &middot; 500x500 o&apos;lcham</p>
                {photoError && <p className="profile-photo-error">{photoError}</p>}
                <button type="button" className="link-more" onClick={() => fileInputRef.current?.click()}>
                  {photo ? "Rasmni o'zgartirish" : 'Rasm yuklash'}
                </button>
              </div>
            )}
          </div>

          {editingProfile && (
            <div className="avatar-preset-section">
              <span className="muted">Tavsiya etilgan avatarlar</span>
              <div className="avatar-preset-grid">
                {PRESET_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    className={`avatar-preset-item ${photo === avatar.src ? 'selected' : ''}`}
                    onClick={() => chooseAvatar(avatar.src)}
                    aria-label="Avatarni tanlash"
                  >
                    <img src={avatar.src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="profile-field">
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
        </article>

        {account && (
          <article className="card">
            <div className="card-header">
              <h3>Hisob xavfsizligi</h3>
              {!editingProfile && <EditIconButton onClick={startEditProfile} />}
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
              <>
                <div className="profile-field">
                  <span className="muted">Parol</span>
                  <div className="password-input-wrap">
                    <input
                      className="form-input password-display-input"
                      type="text"
                      readOnly
                      value={showPassword && storedPassword ? storedPassword : '••••••••'}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordReveal}
                      aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                {revealPromptOpen && (
                  <div className="password-reveal-prompt">
                    <div className="password-input-wrap">
                      <input
                        className="form-input"
                        type="password"
                        value={revealPromptValue}
                        onChange={(e) => setRevealPromptValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && confirmPasswordReveal()}
                        placeholder="Joriy parolni kiriting"
                        autoComplete="current-password"
                        autoFocus
                      />
                      {/* Kod bilan bir xil: ko'zni bosish - bu shu yerda parolni
                          yashirin/ochiq qilish emas, balki haqiqiy parolni
                          o'zini tekshirib ko'rsatadigan tugma. */}
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={confirmPasswordReveal}
                        disabled={revealPromptBusy || !revealPromptValue}
                        aria-label="Parolni ko'rsatish"
                      >
                        <IconEye />
                      </button>
                    </div>
                    {revealPromptError && <p className="profile-photo-error">{revealPromptError}</p>}
                    <div className="action-row" style={{ marginTop: 10 }}>
                      <button className="pill-btn" onClick={() => setRevealPromptOpen(false)} disabled={revealPromptBusy}>
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </article>
        )}
      </div>

      {account && (
        <article className="card" style={{ marginTop: 18 }}>
          <div className="card-header">
            <h3>Xavfli hudud</h3>
          </div>
          <p className="muted" style={{ marginBottom: 14 }}>
            Hisobingizni o&apos;chirsangiz, ism, parol, guruh a&apos;zoligi, XP, tangalar va barcha natijalar
            butunlay o&apos;chiriladi. Bu amalni ortga qaytarib bo&apos;lmaydi.
          </p>
          <button type="button" className="pill-btn" onClick={openDeleteConfirm}>
            Hisobni o&apos;chirish
          </button>
        </article>
      )}

      <article className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <h3>Taklif yoki fikr yozish</h3>
        </div>
        <p className="muted" style={{ marginBottom: 14 }}>
          Sayt haqida biror taklif yoki fikringiz bo&apos;lsa, shu yerga yozing - to&apos;g&apos;ridan-to&apos;g&apos;ri
          ma&apos;muriyatga yetadi, javob kelsa esa yuqoridagi qo&apos;ng&apos;iroqda ko&apos;rinadi.
        </p>
        <textarea
          className="form-input"
          rows={3}
          placeholder="Taklifingizni yozing..."
          value={feedbackText}
          onChange={(e) => {
            setFeedbackText(e.target.value);
            setFeedbackSent(false);
          }}
        />
        <div className="action-row" style={{ marginTop: 10 }}>
          <button type="button" className="pill-btn primary" onClick={sendFeedback} disabled={feedbackSending || !feedbackText.trim()}>
            <IconSend size={16} /> {feedbackSending ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </div>
        {feedbackSent && <p className="muted" style={{ marginTop: 8 }}>Yuborildi, rahmat!</p>}
        {feedbackError && <p className="profile-photo-error">{feedbackError}</p>}
      </article>

      {/* Sidebar's "About me" footer link isn't reachable on mobile (the
          whole sidebar hides below 640px in favor of the bottom nav) -
          this is that same link's only way onto a phone. */}
      <article className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <h3>Dastur haqida</h3>
        </div>
        <a href="https://partfolio-black.vercel.app/" target="_blank" rel="noopener noreferrer" className="about-me-link">
          About me
        </a>
      </article>

      {editingProfile && renameError && (
        <p className="muted" style={{ color: 'var(--critical)', marginTop: 16, marginBottom: 0 }}>
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

      {pendingPhoto && (
        <div className="modal-overlay" onClick={() => setPendingPhoto(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Rasmni almashtirish</h3>
            <p className="muted">Haqiqatan ham rasmni o'zgartirmoqchimisiz?</p>
            <div className="modal-actions">
              <button className="pill-btn" onClick={() => setPendingPhoto(null)}>
                Yo'q
              </button>
              <button className="pill-btn primary" onClick={confirmPhotoChange}>
                Ha
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirmOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Hisobni o&apos;chirishni tasdiqlang</h3>
            <p className="muted">
              Bu amalni ortga qaytarib bo&apos;lmaydi. Tasdiqlash uchun joriy parolingizni kiriting.
            </p>
            <PasswordInput
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Joriy parolingiz"
              autoComplete="current-password"
            />
            {deleteError && <p className="profile-photo-error">{deleteError}</p>}
            <div className="modal-actions">
              <button className="pill-btn" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                Bekor qilish
              </button>
              <button className="pill-btn primary" onClick={confirmDeleteAccount} disabled={deleting}>
                {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
