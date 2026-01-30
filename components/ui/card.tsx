import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className, hover = false, gradient = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all duration-300',
        gradient
          ? 'gradient-border'
          : 'border border-gray-200 bg-white',
        hover && 'hover:border-neon-green/50 hover:shadow-glow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
