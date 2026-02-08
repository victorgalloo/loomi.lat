import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'terminal' | 'outline' | 'success';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1.5 text-label font-medium rounded-lg',
        variant === 'default' && 'bg-surface-2 text-muted border border-border',
        variant === 'terminal' && 'bg-surface-2 text-foreground border border-border',
        variant === 'outline' && 'border border-border text-muted',
        variant === 'success' && 'bg-terminal-green/10 text-terminal-green',
        className
      )}
    >
      {children}
    </span>
  );
}
