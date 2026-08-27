import { useEffect, useRef } from 'react';

// A one-shot "unfold" of three uneven-width bars, not a hamburger<->arrow
// morph like the previous asset - meant to play once per interaction, not
// loop forever in someone's peripheral vision. Rests wherever it lands
// (frame 24 reads as a perfectly normal hamburger, just with the bars in
// a slightly different arrangement than frame 0) until the next hover
// replays it from the top.
export default function LottieMenuToggle({ collapsed, size = 20 }: { collapsed: boolean; size?: number }) {
  // Only used for the button's own aria-label (see Layout.tsx) - this
  // asset has no separate open/closed frame-state to react to, unlike
  // the old hamburger<->arrow morph.
  void collapsed;

  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return;
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: '/animations/menu-toggle.json'
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  function playOnce() {
    // stop() rewinds to frame 0 before play() runs the segment forward,
    // so every hover replays the same unfold rather than continuing
    // from wherever a previous, possibly-interrupted play left off.
    animRef.current?.stop();
    animRef.current?.play();
  }

  return <div ref={containerRef} style={{ width: size, height: size }} onMouseEnter={playOnce} />;
}
