import Link from 'next/link';
import { IconPlay, IconUsers, IconBolt, IconLock } from './icons';

export default function KodBanner({
  href,
  onPlay,
  compact,
  ctaLabel = 'Kirish',
  // Only a real (code-joined) group's students get to actually use this -
  // still shown to everyone else so they know it exists, just pointed at
  // Guruhlar instead of the game itself until they join one.
  locked = false
}: {
  href?: string;
  onPlay?: () => void;
  compact?: boolean;
  ctaLabel?: string;
  locked?: boolean;
}) {
  const cta = locked ? (
    <Link href="/guruhlar" className="battle-cta locked">
      <IconLock size={15} /> Guruhga qo'shilish
    </Link>
  ) : href ? (
    <Link href={href} className="battle-cta">
      <IconBolt /> {ctaLabel}
    </Link>
  ) : onPlay ? (
    <button type="button" className="battle-cta" onClick={onPlay}>
      <IconBolt /> {ctaLabel}
    </button>
  ) : null;

  return (
    <div className={`battle-banner kod ${compact ? 'compact' : ''}`}>
      <div className="battle-banner-top">
        <span className="battle-badge">
          <IconPlay size={14} />
        </span>
        {locked ? (
          <span className="battle-badge alt locked-badge">
            <IconLock size={14} /> Guruh kerak
          </span>
        ) : (
          <span className="battle-badge alt">
            <IconUsers size={14} /> Sinf
          </span>
        )}
      </div>

      <div className="battle-banner-main">
        <h2 className="battle-title">KOD</h2>
        <p className="battle-subtitle">
          {locked ? "Faqat guruhga a'zo o'quvchilar uchun" : "Sinfdosh o'yiniga qo'shiling"}
        </p>
        <div className="battle-features">
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconUsers size={13} />
            </span>
            Sinf
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconBolt size={13} />
            </span>
            Tezkor
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconPlay size={13} />
            </span>
            Live
          </span>
        </div>
      </div>

      {cta && <div className="battle-banner-footer">{cta}</div>}
    </div>
  );
}
