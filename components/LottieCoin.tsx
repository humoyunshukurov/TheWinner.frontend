import { useEffect, useRef } from 'react';

export default function LottieCoin({ size = 40 }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return;
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/animations/coin.json'
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} className="lottie-coin" style={{ width: size, height: size }} />;
}
