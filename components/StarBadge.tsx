import { useEffect, useRef } from 'react';

// Continuous decorative flourish (unlike CrownBadge's one-shot pop-in) -
// marks a group's top scorer on the Reyting page: always rank 1 on the
// group-scoped table, but on the global "Barcha o'yinchilar" table it can
// land on any row (one per group) alongside whichever player has that
// group's highest XP - independent of the crown, which only ever marks
// the single overall #1.
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
