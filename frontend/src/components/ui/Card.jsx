import { cn } from '../../lib/utils';

export function Card({ className, ...props }) {
  return <section className={cn('glass rounded-2xl border p-5 sm:p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn('text-base font-semibold tracking-tight text-foreground', className)} {...props} />;
}
