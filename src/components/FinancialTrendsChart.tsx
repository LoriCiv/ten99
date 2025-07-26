"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface TrendData {
  month: string;
  Income: number;
  Expenses: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="rounded-lg border p-2 shadow-sm"
        style={{
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderColor: 'hsl(var(--border))'
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1 leading-none">
            <span className="text-[11px] uppercase text-muted-foreground">
              {label}
            </span>
          </div>
          {payload.map((p, index) => (
             <div key={index} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <div className="flex flex-1 justify-between leading-none">
                    <span className="text-muted-foreground">{p.name}:</span>
                    <span>${p.value?.toFixed(2)}</span>
                </div>
             </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};


interface FinancialTrendsChartProps {
  data: TrendData[];
}

export default function FinancialTrendsChart({ data }: FinancialTrendsChartProps) {
  return (
    // ✅ THE FIX: The chart is now wrapped in a div with the correct `bg-card` class.
    <div className="bg-card p-4 rounded-lg border">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
            
            <Tooltip content={<CustomTooltip />} />

            <Legend />
            <Line type="monotone" dataKey="Income" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Expenses" stroke="hsl(var(--destructive))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
    </div>
  );
}