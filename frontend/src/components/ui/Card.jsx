import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return <section className={cn('glass rounded-lg border p-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn('text-sm font-semibold text-foreground/80', className)} {...props} />;
}
