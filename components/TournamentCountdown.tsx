import { useEffect, useState } from 'react';
import { IconBolt } from './icons';

const TOTAL_SECONDS = 45;
const RING_SIZE = 132;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Ticks down to 0 from a server-given epoch ms timestamp - re-synced from
// `autoStartAt` on every poll (the parent passes a fresh value in as props
// every 1.5s), so a slow client tab or a missed tick can't drift far from
// what every other participant in the lobby is seeing.
export default function TournamentCountdown({ autoStartAt }: { autoStartAt: number }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((autoStartAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((autoStartAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [autoStartAt]);

  const urgency = secondsLeft <= 5 ? 'critical' : secondsLeft <= 15 ? 'warning' : 'accent';
  const progress = Math.min(1, Math.max(0, secondsLeft / TOTAL_SECONDS));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className={`tournament-countdown ${urgency}`}>
      <div className="tournament-countdown-ring">
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <circle
            className="tournament-countdown-track"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            className="tournament-countdown-progress"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="tournament-countdown-number">
          <span>{secondsLeft}</span>
          <small>soniya</small>
        </div>
      </div>
      <p className="tournament-countdown-label">
        <IconBolt size={15} /> Turnir avtomatik boshlanadi
      </p>
    </div>
  );
}
