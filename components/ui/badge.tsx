import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'terminal' | 'outline' | 'success' | 'info' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-label font-medium rounded-lg',
        variant === 'default' && 'bg-surface-2 text-muted border border-border',
        variant === 'terminal' && 'bg-surface-2 text-foreground border border-border',
        variant === 'outline' && 'border border-border text-muted',
        variant === 'success' && 'bg-success-muted text-success border border-success/20',
        variant === 'info' && 'bg-info-muted text-info border border-info/20',
        variant === 'warning' && 'bg-warning-muted text-warning border border-warning/20',
        variant === 'error' && 'bg-error-muted text-error border border-error/20',
        className
      )}
    >
      {children}
    </span>
  );
}
