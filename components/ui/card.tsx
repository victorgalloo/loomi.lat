import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  terminal?: boolean;
  title?: string;
  accent?: 'info' | 'warning' | 'success' | 'error';
}

export function Card({ children, className, hover = false, terminal = false, title, accent }: CardProps) {
  if (terminal) {
    return (
      <div className={cn('bg-surface-elevated rounded-xl border border-border overflow-hidden shadow-card', className)}>
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-2 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
          </div>
          {title && <span className="text-xs text-muted font-mono ml-2">{title}</span>}
        </div>
        <div className="p-5">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all duration-200',
        'border border-border bg-surface-elevated shadow-card',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 hover:border-border-hover',
        accent === 'info' && 'border-l-[3px] border-l-info',
        accent === 'warning' && 'border-l-[3px] border-l-warning',
        accent === 'success' && 'border-l-[3px] border-l-success',
        accent === 'error' && 'border-l-[3px] border-l-error',
        className
      )}
    >
      {children}
    </div>
  );
}
