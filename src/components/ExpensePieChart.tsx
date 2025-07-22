"use client";

import { useMemo, memo } from 'react';
import type { Expense } from '@/types/app-interfaces';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExpensePieChartProps {
    expenses: Expense[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    payload: {
        name: string;
        value: number;
    }
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#f59e0b'];

const formatCategoryName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const ExpensePieChartComponent = ({ expenses }: ExpensePieChartProps) => {

    const data = useMemo(() => {
        if (!expenses || expenses.length === 0) {
            return [];
        }
        const categoryTotals = expenses.reduce((acc, expense: Expense) => {
            const category = formatCategoryName(expense.category);
            const amount = Number(expense.amount) || 0;
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {} as { [key: string]: number });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

    }, [expenses]);

    // ✅ FIX: Mark geometric properties as optional and add a guard clause.
    const renderCustomizedLabel = (props: {
        cx: number;
        cy: number;
        midAngle?: number;
        innerRadius?: number;
        outerRadius?: number;
        percent?: number;
    }) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

        // Gracefully handle cases where props might be undefined
        if (percent === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined) {
            return null;
        }

        if (percent < 0.05) return null;

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
    
    const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
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
                    outerRadius={100}
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