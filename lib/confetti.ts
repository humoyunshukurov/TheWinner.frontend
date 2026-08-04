const COLORS = ['#4f46e5', '#fbbf24', '#22c55e', '#f97316'];

export function burstSideConfetti(durationMs = 3000) {
  let cancelled = false;

  import('canvas-confetti').then(({ default: confetti }) => {
    if (cancelled) return;
    const end = Date.now() + durationMs;

    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS });
      if (Date.now() < end && !cancelled) {
        requestAnimationFrame(frame);
      }
    })();
  });

  return () => {
    cancelled = true;
  };
}
