import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  terminal?: boolean;
  title?: string;
}

export function Card({ children, className, hover = false, terminal = false, title }: CardProps) {
  if (terminal) {
    return (
      <div className={cn('bg-surface rounded-xl border border-border overflow-hidden', className)}>
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
        'rounded-xl p-6 transition-all duration-300',
        'border border-border bg-surface',
        hover && 'hover:border-border-hover',
        className
      )}
    >
      {children}
    </div>
  );
}
