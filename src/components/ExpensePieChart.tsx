// src/components/ExpensePieChart.tsx
"use client";

import { useMemo, memo } from 'react';
import type { Expense } from '@/types/app-interfaces';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExpensePieChartProps {
    expenses: Expense[];
}

// More distinct colors for better visual separation
const COLORS = ['#3b82f6', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#f59e0b'];

// A helper to format category names consistently
const formatCategoryName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const ExpensePieChartComponent = ({ expenses }: ExpensePieChartProps) => {

    const data = useMemo(() => {
        if (!expenses || expenses.length === 0) {
            return [];
        }

        const categoryTotals = expenses.reduce((acc, expense) => {
            const category = formatCategoryName(expense.category);
            // ✅ FIX: Ensure the amount is always treated as a number during summation
            const amount = Number(expense.amount) || 0;
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {} as { [key: string]: number });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort by value, largest first

    }, [expenses]);

    // A more informative custom label for pie slices
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
        if (percent < 0.05) return null; // Don't label very small slices

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };
    
    // Custom Tooltip for better styling
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-background border rounded-md shadow-lg">
                    <p className="font-bold">{`${payload[0].name}`}</p>
                    <p className="text-primary">{`Total: $${Number(payload[0].value).toFixed(2)}`}</p>
                </div>
            );
        }
        return null;
    };

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No expense data to display.</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100} // Made the pie slightly larger
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default memo(ExpensePieChartComponent);