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

const colors = ['#2563eb', '#16a34a', '#dc2626', '#0891b2', '#7c3aed', '#ea580c', '#475569', '#db2777'];

export function ExpensePie({ data }) {
  const chartData = data.filter((item) => Number(item.total) > 0).map((item) => ({ name: item.name, value: Number(item.total) }));
  return (
    <Card className="min-h-[320px]">
      <CardTitle>Expense Pie Chart</CardTitle>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={46}>
            {chartData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(value) => currency(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function DailyLine({ data }) {
  const chartData = data.map((item) => ({ date: shortDate(item.date), amount: Number(item.amount) }));
  return (
    <Card className="min-h-[320px]">
      <CardTitle>Daily Spending Trend</CardTitle>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => currency(value)} />
          <Line type="monotone" dataKey="amount" stroke="#0891b2" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function CreditDebitBar({ month }) {
  const data = [{ name: 'Current Month', Credits: Number(month.totalCredits), Debits: Number(month.totalDebits) }];
  return (
    <Card className="min-h-[320px]">
      <CardTitle>Credit vs Debit</CardTitle>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `₹${value}`} />
          <Tooltip formatter={(value) => currency(value)} />
          <Legend />
          <Bar dataKey="Credits" fill="#16a34a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Debits" fill="#dc2626" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
