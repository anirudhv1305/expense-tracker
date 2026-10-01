import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { currency, shortDate } from '../lib/utils';
import { Card, CardTitle } from './ui/Card';

const colors = Array.from({ length: 8 }, (_, index) => `hsl(var(--chart-${index + 1}))`);

export function ExpensePie({ data }) {
  const chartData = data.filter((item) => Number(item.total) > 0).map((item) => ({ name: item.name, value: Number(item.total) }));
  return (
    <Card className="min-h-[300px]">
      <CardTitle>Spending by category</CardTitle>
      <p className="mt-1 text-sm text-foreground/55">See how this month’s expenses are distributed.</p>
      {chartData.length ? <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={88} innerRadius={54} paddingAngle={2}>
            {chartData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(value) => currency(value)} contentStyle={{ borderRadius: 14, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }} />
          <Legend verticalAlign="bottom" iconType="circle" />
        </PieChart>
      </ResponsiveContainer> : <div className="grid h-[220px] place-items-center text-sm text-foreground/50">No spending recorded yet</div>}
    </Card>
  );
}

export function DailyLine({ data }) {
  const chartData = data.map((item) => ({ date: shortDate(item.date), amount: Number(item.amount) }));
  return (
    <Card className="min-h-[300px]">
      <CardTitle>Daily spending</CardTitle>
      <p className="mt-1 text-sm text-foreground/55">Expenses recorded across the month.</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--foreground) / .55)' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 11, fill: 'hsl(var(--foreground) / .55)' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => currency(value)} contentStyle={{ borderRadius: 14, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }} />
          <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function CreditDebitBar({ month }) {
  const data = [{ name: 'Current Month', Credits: Number(month.totalCredits), Debits: Number(month.totalDebits) }];
  return (
    <Card className="min-h-[300px]">
      <CardTitle>Income & expenses</CardTitle>
      <p className="mt-1 text-sm text-foreground/55">A side-by-side view of your cash flow.</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground) / .55)' }} />
          <YAxis tickFormatter={(value) => `₹${value}`} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground) / .55)' }} />
          <Tooltip formatter={(value) => currency(value)} contentStyle={{ borderRadius: 14, borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }} />
          <Legend iconType="circle" />
          <Bar dataKey="Credits" fill="hsl(var(--success))" radius={[7, 7, 0, 0]} />
          <Bar dataKey="Debits" fill="hsl(var(--destructive))" radius={[7, 7, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
