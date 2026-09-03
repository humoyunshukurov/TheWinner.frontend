import Avatar from './Avatar';

// Two-lane "race track" showing which question each side of a live match
// is currently on - one lane per player, a shared number scale underneath
// both. Position is purely index/total (0-based "currentIndex" maps onto
// the matching tick), so it reads the same regardless of how fast either
// side is actually answering; the CSS transition on `left` is what makes
// each avatar visibly slide over instead of jumping.
function trackPercent(index: number, total: number) {
  const clamped = Math.max(0, Math.min(index, total - 1));
  return ((clamped + 0.5) / total) * 100;
}

export default function QuestionTracker({
  total,
  mePhoto,
  meIndex,
  oppPhoto,
  oppIndex
}: {
  total: number;
  mePhoto: string | null;
  meIndex: number;
  oppPhoto: string | null;
  oppIndex: number;
}) {
  if (total <= 1) return null;

  return (
    <div className="q-tracker">
      <div className="q-tracker-lane">
        <div className="q-tracker-inner">
          <div className="q-tracker-track" />
          <div className="q-tracker-avatar mine" style={{ left: `${trackPercent(meIndex, total)}%` }}>
            <Avatar photo={mePhoto} size={26} />
          </div>
        </div>
      </div>
      <div className="q-tracker-lane">
        <div className="q-tracker-inner">
          <div className="q-tracker-track" />
          <div className="q-tracker-avatar opp" style={{ left: `${trackPercent(oppIndex, total)}%` }}>
            <Avatar photo={oppPhoto} size={26} />
          </div>
        </div>
      </div>
      <div className="q-tracker-numbers" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}
