'use client';

import { useMousePosition } from '@/lib/hooks/use-mouse-position';
import { useEffect, useRef, useState } from 'react';

interface SpotlightProps {
  className?: string;
  size?: number;
}

export function Spotlight({ className, size = 400 }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = mousePosition.x - rect.left;
    const y = mousePosition.y - rect.top;

    // Check if mouse is within container
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setPosition({ x, y });
      setOpacity(1);
    } else {
      setOpacity(0);
    }
  }, [mousePosition]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="pointer-events-none absolute transition-opacity duration-300"
        style={{
          background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, rgba(0, 255, 102, 0.12), transparent 40%)`,
          width: '100%',
          height: '100%',
          opacity,
        }}
      />
    </div>
  );
}
