import Link from 'next/link';
import { IconBolt, IconTrendUp, IconUsers } from './icons';

export default function MarafonBanner({
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
    <div className={`battle-banner marathon ${compact ? 'compact' : ''}`}>
      <div className="battle-banner-top">
        <span className="battle-badge">
          <IconTrendUp size={14} />
        </span>
        <span className="battle-badge alt">
          <IconUsers size={14} /> Yakka
        </span>
      </div>

      <div className="battle-banner-main">
        <h2 className="battle-title">MARAFON</h2>
        <p className="battle-subtitle">Xato qilmasdan qancha uzoqqa borasiz?</p>
        <div className="battle-features">
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconUsers size={13} />
            </span>
            Yakka
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconTrendUp size={13} />
            </span>
            Cheksiz
          </span>
          <span className="battle-feature">
            <span className="battle-feature-icon">
              <IconBolt size={13} />
            </span>
            1 xato = tugaydi
          </span>
        </div>
      </div>

      {cta && <div className="battle-banner-footer">{cta}</div>}
    </div>
  );
}
