import { cn } from '../../lib/utils';

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50',
        size === 'icon' ? 'h-10 w-10' : 'h-10 px-4',
        variant === 'primary' && 'bg-primary text-white hover:opacity-90',
        variant === 'secondary' && 'bg-muted text-foreground hover:bg-border',
        variant === 'ghost' && 'hover:bg-muted',
        variant === 'danger' && 'bg-destructive text-white hover:opacity-90',
        className
      )}
      {...props}
    />
  );
}
