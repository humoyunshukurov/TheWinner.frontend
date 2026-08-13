import { useState } from 'react';
import { IconEdit } from './icons';
import { getGuest } from '../lib/guest';
import { loadProfileBio, saveProfileBio } from '../lib/profile';

const BIO_MAX_LENGTH = 400;

// Topbar button + modal, styled after LinkedIn's "About" section - a
// short self-written bio, viewed and edited in one place instead of
// bouncing to Sozlamalar for something this small.
export default function AboutMe() {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function openModal() {
    const { guestId } = getGuest();
    const current = loadProfileBio(guestId);
    setBio(current);
    setDraft(current);
    setEditing(!current);
    setOpen(true);
  }

  function save() {
    const { guestId } = getGuest();
    const trimmed = draft.trim();
    saveProfileBio(guestId, trimmed);
    setBio(trimmed);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(bio);
    if (bio) {
      setEditing(false);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <button type="button" className="about-me-btn" onClick={openModal}>
        Men haqimda
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box modal-box-wide about-me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="about-me-header">
              <h3>Men haqimda</h3>
              {!editing && (
                <button type="button" className="icon-edit-btn" onClick={() => setEditing(true)} aria-label="Tahrirlash">
                  <IconEdit size={15} />
                </button>
              )}
            </div>

            {editing ? (
              <>
                <textarea
                  className="form-input about-me-textarea"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, BIO_MAX_LENGTH))}
                  placeholder="O'zingiz haqingizda qisqacha yozing..."
                  autoFocus
                />
                <span className="about-me-counter">
                  {draft.length}/{BIO_MAX_LENGTH}
                </span>
                <div className="modal-actions">
                  <button type="button" className="pill-btn" onClick={cancelEdit}>
                    Bekor qilish
                  </button>
                  <button type="button" className="pill-btn primary" onClick={save}>
                    Saqlash
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="about-me-text">{bio}</p>
                <div className="modal-actions">
                  <button type="button" className="pill-btn" onClick={() => setOpen(false)}>
                    Yopish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
