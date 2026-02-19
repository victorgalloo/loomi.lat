'use client';

import { ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  reverse?: boolean;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({ children, reverse = false, speed = 30, pauseOnHover = true, className = '' }: MarqueeProps) {
  return (
    <div
      className={`overflow-hidden ${pauseOnHover ? '[&:hover>div]:paused' : ''} ${className}`}
      style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
    >
      <div
        className={`flex w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
