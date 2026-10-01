import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Button = forwardRef(function Button({ className, variant = 'primary', size = 'md', ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 active:scale-[.98] disabled:pointer-events-none disabled:cursor-not-allowed',
        size === 'icon' ? 'h-11 w-11' : 'min-h-11 px-4',
        variant === 'primary' && 'app-button-primary bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-muted text-foreground hover:bg-border disabled:text-foreground/70',
        variant === 'ghost' && 'hover:bg-muted disabled:text-foreground/50',
        variant === 'danger' && 'bg-destructive text-destructive-foreground hover:opacity-90 disabled:border disabled:border-border disabled:bg-muted disabled:text-foreground/70 disabled:hover:opacity-100',
        className
      )}
      {...props}
    />
  );
});
