import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconLogout } from './icons';
import { isRegistered, logout } from '../lib/guest';

export default function LogoutButton({ compact }) {
  const router = useRouter();
  const [registered, setRegistered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setRegistered(isRegistered());
  }, [router.pathname]);

  if (!registered) return null;

  function handleConfirm() {
    logout();
    setConfirming(false);
    router.push('/');
  }

  return (
    <>
      <button
        type="button"
        className={compact ? 'theme-toggle-btn' : 'pill-btn logout-btn'}
        onClick={() => setConfirming(true)}
        aria-label="Hisobdan chiqish"
      >
        <IconLogout size={compact ? 17 : undefined} />
        {!compact && ' Hisobdan chiqish'}
      </button>

      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(false)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <h3>Chiqishni tasdiqlang</h3>
            <p className="muted">Haqiqatan ham hisobdan chiqmoqchimisiz?</p>
            <div className="modal-actions">
              <button className="pill-btn" onClick={() => setConfirming(false)}>
                Yo'q
              </button>
              <button className="pill-btn primary" onClick={handleConfirm}>
                Ha
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
