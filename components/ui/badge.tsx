import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'neon' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 text-xs font-medium rounded-full',
        variant === 'default' && 'bg-gray-100 text-gray-600',
        variant === 'neon' && 'bg-neon-subtle text-neon-green-dark border border-neon-green/30',
        variant === 'outline' && 'border border-gray-200 text-gray-600',
        className
      )}
    >
      {children}
    </span>
  );
}
