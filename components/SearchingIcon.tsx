import { useEffect, useRef } from 'react';

// Shared "looking for people" animation - the 1vs1 opponent search and
// the Turnir waiting room are the same underlying situation (waiting on
// other real players to show up before a match can start), so they get
// the same icon. Sized off the viewport (see .searching-icon in
// styles.css) rather than its own container, so it reads as roughly the
// same size regardless of which card it's dropped into.
export default function SearchingIcon() {
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
        path: '/animations/community.json'
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} className="searching-icon" />;
}
