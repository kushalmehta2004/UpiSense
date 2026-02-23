import { useRef, useState, useEffect } from 'react';

export function CountUp({ value, duration = 800, decimals = 0 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const num = Number(value) || 0;

  useEffect(() => {
    if (!ref.current || hasAnimated) return;
    const start = 0;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      const v = start + (num - start) * eased;
      setDisplay(decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v));
      if (t < 1) requestAnimationFrame(tick);
      else setHasAnimated(true);
    };
    requestAnimationFrame(tick);
  }, [num, duration, decimals, hasAnimated]);

  return <span ref={ref}>{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-IN')}</span>;
}
