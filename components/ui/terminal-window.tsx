'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TerminalWindowProps {
  children: ReactNode;
  title?: string;
  className?: string;
  showDots?: boolean;
  variant?: 'default' | 'minimal';
}

export function TerminalWindow({
  children,
  title = 'terminal',
  className,
  showDots = true,
  variant = 'default',
}: TerminalWindowProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-xl border border-border overflow-hidden shadow-card',
        className
      )}
    >
      {/* Header with traffic lights */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-2 border-b border-border">
        {showDots && (
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-terminal-red" />
            <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
            <div className="w-3 h-3 rounded-full bg-terminal-green" />
          </div>
        )}
        {title && (
          <span className="text-xs text-muted font-mono ml-3">{title}</span>
        )}
      </div>

      {/* Content */}
      <div className={cn(variant === 'minimal' ? '' : 'p-5')}>
        {children}
      </div>
    </div>
  );
}

export function TerminalCard({
  children,
  title,
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <TerminalWindow title={title} className={className} variant="minimal">
      {children}
    </TerminalWindow>
  );
}
