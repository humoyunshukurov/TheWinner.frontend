import { useEffect, useRef } from 'react';

// Continuous decorative flourish (unlike CrownBadge's one-shot pop-in) -
// next to a group/global leaderboard's #1 entry, and on every O'yin hub
// game card so the whole page reads as a bit more alive.
export default function StarBadge({ size = 32, className = '' }: { size?: number; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return;
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/animations/star.json'
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} className={className} style={{ width: size, height: size }} />;
}
