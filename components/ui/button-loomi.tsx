'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = false, children, ...props }, ref) => {
    // Filter out conflicting animation props that clash with framer-motion
    const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...buttonProps } = props as Record<string, unknown>;
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg overflow-hidden',
          size === 'sm' && 'px-4 py-2 text-sm',
          size === 'md' && 'px-5 py-2.5 text-sm',
          size === 'lg' && 'px-7 py-3.5 text-base',
          variant === 'primary' && [
            'bg-neon-green text-gray-950 hover:bg-neon-green/90',
            glow && 'shadow-[0_0_25px_rgba(0,255,102,0.4)]',
          ],
          variant === 'secondary' && [
            'bg-surface-2 text-foreground border border-border hover:bg-border',
          ],
          variant === 'ghost' && [
            'bg-transparent text-muted hover:text-foreground hover:bg-surface-2',
          ],
          className
        )}
        {...buttonProps}
      >
        {/* Shimmer effect for primary */}
        {variant === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center">{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
