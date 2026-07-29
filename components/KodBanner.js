import Link from 'next/link';
import { IconPlay, IconUsers, IconBolt } from './icons';

export default function KodBanner({ href, onPlay, compact, ctaLabel = 'Kirish' }) {
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
    <div className={`battle-banner kod ${compact ? 'compact' : ''}`}>
      <div className="battle-banner-top">
        <span className="battle-badge">
          <IconPlay size={14} />
        </span>
        <span className="battle-badge alt">
          <IconUsers size={14} /> Sinf
        </span>
      </div>

      <div className="battle-banner-main">
        <h2 className="battle-title">KOD</h2>
        <p className="battle-subtitle">Sinfdosh o'yiniga qo'shiling</p>
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
