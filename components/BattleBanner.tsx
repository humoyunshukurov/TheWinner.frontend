import { IconSwords, IconTrophy, IconUsers, IconClock, IconBolt } from './icons';

export default function BattleBanner({ onPlay, compact }: { onPlay: () => void; compact?: boolean }) {
  return (
    <div className={`battle-banner ${compact ? 'compact' : ''}`}>
      <div className="battle-banner-top">
        <span className="battle-badge">
          <IconSwords size={14} />
        </span>
        <span className="battle-badge alt">
          <IconTrophy size={14} /> Reyting
        </span>
      </div>

      <div className="battle-banner-main">
        <h2 className="battle-title">BATTLE</h2>
        <p className="battle-subtitle">Tasodifiy raqibga qarshi</p>
        <div className="battle-features">
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconUsers size={13} />
            </span>
            Tasodifiy
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconClock size={13} />
            </span>
            Tezkor
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconTrophy size={13} />
            </span>
            Coin
          </span>
        </div>
      </div>

      {onPlay && (
        <div className="battle-banner-footer">
          <button type="button" className="battle-cta" onClick={onPlay}>
            <IconBolt /> O'ynash
          </button>
        </div>
      )}
    </div>
  );
}
