import { currency } from '../lib/utils';
import { Card } from './ui/Card';

export default function MetricCard({ label, value, tone = 'default', icon: Icon, format = 'currency' }) {
  const colors = {
    default: 'text-foreground',
    credit: 'text-success',
    debit: 'text-destructive',
    analytics: 'text-analytics'
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">{label}</p>
        {Icon && <Icon className={colors[tone]} size={18} />}
      </div>
      <p className={`mt-3 text-2xl font-semibold ${colors[tone]}`}>{format === 'currency' ? currency(value) : value}</p>
    </Card>
  );
}
