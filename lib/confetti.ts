const COLORS = ['#4f46e5', '#fbbf24', '#22c55e', '#f97316'];

// A win/celebration nice-to-have, never load-bearing - if the chunk fails
// to load (flaky mobile connection) or canvas-confetti throws for any
// reason on some device/browser, this must fail silently and never take
// the actual result screen down with it.
export function burstSideConfetti(durationMs = 3000) {
  let cancelled = false;

  import('canvas-confetti')
    .then(({ default: confetti }) => {
      if (cancelled) return;
      const end = Date.now() + durationMs;

      (function frame() {
        try {
          confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS });
          confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS });
        } catch {
          cancelled = true;
          return;
        }
        if (Date.now() < end && !cancelled) {
          requestAnimationFrame(frame);
        }
      })();
    })
    .catch(() => {});

  return () => {
    cancelled = true;
  };
}
