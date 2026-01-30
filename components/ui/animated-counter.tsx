'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/lib/hooks/use-in-view';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView<HTMLSpanElement>({ threshold: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end * Math.pow(10, decimals)) / Math.pow(10, decimals));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration, decimals]);

  return (
    <span ref={ref}>
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : count}
      {suffix}
    </span>
  );
}
