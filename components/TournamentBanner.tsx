import Link from 'next/link';
import { IconTrophy, IconUsers, IconBolt } from './icons';

export default function TournamentBanner({
  href,
  onPlay,
  compact,
  ctaLabel = 'Kirish'
}: {
  href?: string;
  onPlay?: () => void;
  compact?: boolean;
  ctaLabel?: string;
}) {
  const cta = href ? (
    <Link href={href} className="battle-cta">
      <IconBolt /> {ctaLabel}
    </Link>
  ) : onPlay ? (
    <button type="button" className="battle-cta" onClick={onPlay}>
      <IconBolt /> {ctaLabel}
    </button>
  ) : null;

  return (
    <div className={`battle-banner tournament ${compact ? 'compact' : ''}`}>
      <div className="battle-banner-top">
        <span className="battle-badge">
          <IconTrophy size={14} />
        </span>
        <span className="battle-badge alt">
          <IconUsers size={14} /> Ko'p o'yinchi
        </span>
      </div>

      <div className="battle-banner-main">
        <h2 className="battle-title">TURNIR</h2>
        <p className="battle-subtitle">Boshqa o'quvchilar bilan bellashing</p>
        <div className="battle-features">
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconUsers size={13} />
            </span>
            Ko'p o'yinchi
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconTrophy size={13} />
            </span>
            Pog'ona
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconBolt size={13} />
            </span>
            Bonus
          </span>
        </div>
      </div>

      {cta && <div className="battle-banner-footer">{cta}</div>}
    </div>
  );
}
