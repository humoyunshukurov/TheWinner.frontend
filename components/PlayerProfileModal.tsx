import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { IconTrendUp, IconGlobe } from './icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PlayerSummary {
  guestId: string;
  name: string;
  group?: string | null;
  photo?: string | null;
}

// Public rank card for whichever player was clicked on Reyting - anyone
// can already see everyone's name/group/XP right there in the table this
// opens from, so this just makes the same public info (rank tier, XP
// toward the next one) easier to read at a glance without also digging
// up anything actually private (there's nothing account-level in here -
// no email, password, telegram, etc., only what getRankInfo() itself
// returns for the clicked guestId).
export default function PlayerProfileModal({ player, onClose }: { player: PlayerSummary; onClose: () => void }) {
  const [hpData, setHpData] = useState(null);

  useEffect(() => {
    setHpData(null);
    fetch(`${API_URL}/hp?guestId=${player.guestId}`)
      .then((res) => res.json())
      .then(setHpData)
      .catch(() => {});
  }, [player.guestId]);

  const rank = hpData?.rank;
  const progressLabel = rank ? `${hpData.hp} / ${rank.max ?? hpData.hp}` : '...';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box player-profile-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Yopish">
          &times;
        </button>

        <div className="player-profile-header">
          <Avatar photo={player.photo} size={72} />
          <h3>{player.name}</h3>
          {player.group && <p className="muted">{player.group}</p>}
        </div>

        <div className="level-row">
          <IconTrendUp size={18} />
          <span className="muted">Bosqich:</span>
          <strong>{rank ? rank.stage : '...'}</strong>
        </div>

        <div className="level-progress-bar">
          <div className="level-progress-fill" style={{ width: `${(rank?.progress ?? 0) * 100}%` }}>
            <span>{progressLabel}</span>
          </div>
        </div>

        <p className="level-caption">
          {rank
            ? rank.hpToNext != null
              ? `Keyingi bosqichgacha ${rank.hpToNext} XP qoldi`
              : 'Eng yuqori bosqichda'
            : 'Yuklanmoqda...'}
        </p>

        <div className="level-divider" />

        <div className="level-row" style={{ marginBottom: 0 }}>
          <IconGlobe size={18} />
          <span className="muted">Daraja:</span>
          <strong>{rank ? rank.label : '...'}</strong>
        </div>
      </div>
    </div>
  );
}
