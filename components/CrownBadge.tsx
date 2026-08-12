import { useEffect, useRef } from 'react';

// A small "you've reached the top rank" badge - plays its pop-in once (it's
// a ~180-frame animation that settles by ~frame 45 and just holds static
// afterward, verified by rendering it frame-by-frame), then stays put as a
// permanent decoration. Not looped - it isn't meant to keep bouncing every
// time you glance at the topbar.
export default function CrownBadge({ size = 26, className = '' }: { size?: number; className?: string }) {
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
        autoplay: true,
        path: '/animations/crown.json'
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} className={className} style={{ width: size, height: size }} />;
}
