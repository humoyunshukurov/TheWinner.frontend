import { useState } from 'react';
import { IconShield } from './icons';
import { registerGuest, previewGuestId } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AccessGate({ onDone }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [conflict, setConflict] = useState(null);

  function finishRegistration() {
    registerGuest(name, code);
    onDone();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError('Ismingizni kiriting');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Kod aynan 6 ta raqamdan iborat bo'lishi kerak");
      return;
    }

    setError(null);
    setChecking(true);

    const guestId = previewGuestId(name, code);
    try {
      const [coinsRes, hpRes] = await Promise.all([
        fetch(`${API_URL}/coins?guestId=${guestId}`).then((r) => r.json()),
        fetch(`${API_URL}/hp?guestId=${guestId}`).then((r) => r.json())
      ]);

      if ((coinsRes.coins || 0) > 0 || (hpRes.hp || 0) > 0) {
        setChecking(false);
        setConflict({ coins: coinsRes.coins || 0, hp: hpRes.hp || 0 });
        return;
      }
    } catch {
      // agar tekshirib bo'lmasa, baribir davom ettiramiz
    }

    setChecking(false);
    finishRegistration();
  }

  if (conflict) {
    return (
      <div className="game-hero">
        <div className="game-card access-gate-card">
          <div className="game-icon-badge">
            <IconShield size={22} />
          </div>
          <h3>Bu kod band</h3>
          <p className="muted">
            "{name}" ismi va shu kod bilan allaqachon <strong>{conflict.coins} tanga</strong> va{' '}
            <strong>{conflict.hp} HP</strong> to'plangan. Agar bu sizning avvalgi hisobingiz bo'lsa, davom
            etishingiz mumkin. Aks holda, boshqa kod tanlang — aks holda ikkovingiz bitta hisobni
            baham ko'rib qolasiz.
          </p>
          <div className="action-row">
            <button className="pill-btn primary" onClick={finishRegistration}>
              Ha, bu men
            </button>
            <button
              className="pill-btn"
              onClick={() => {
                setConflict(null);
                setCode('');
              }}
            >
              Yo'q, boshqa kod tanlayman
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-hero">
      <div className="game-card access-gate-card">
        <div className="game-icon-badge">
          <IconShield size={22} />
        </div>
        <h3>Davom etishdan oldin</h3>
        <p className="muted">
          Test yechish va o'yin o'ynash uchun ismingiz va 6 xonali shaxsiy kodingiz kerak. Kodni o'zingiz
          tanlaysiz — uni eslab qoling, keyinroq shu kod bilan natijalaringizga qaytasiz. Boshqa birov
          ishlatmagan, o'zingizga xos kod tanlang.
        </p>

        <form onSubmit={handleSubmit} className="access-gate-form">
          <input
            className="form-input"
            placeholder="Ismingiz"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="form-input"
            placeholder="6 xonali kod (masalan: 482910)"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
          />
          {error && <p className="profile-photo-error">{error}</p>}
          <button className="pill-btn primary" type="submit" disabled={checking}>
            {checking ? 'Tekshirilmoqda...' : 'Davom etish'}
          </button>
        </form>
      </div>
    </div>
  );
}
