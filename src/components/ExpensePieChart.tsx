// src/components/ExpensePieChart.tsx
"use client";

import { useMemo, useCallback, useState, useEffect, memo } from 'react';
import type { Expense } from '@/types/app-interfaces';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExpensePieChartProps {
    expenses: Expense[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const ExpensePieChartComponent = ({ expenses }: ExpensePieChartProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const data = useMemo(() => {
        const categoryTotals = expenses.reduce((acc, expense) => {
            const category = expense.category.replace(/_/g, ' ');
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
        }, {} as { [key: string]: number });

        return Object.entries(categoryTotals).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
        }));
    }, [expenses]);

    const renderCustomizedLabel = useCallback((props: any) => {
        const { percent } = props;
        if (percent && percent > 0.05) {
            return `${(percent * 100).toFixed(0)}%`;
        }
        return null;
    }, []);

    if (!isMounted) {
        return <div className="flex items-center justify-center h-full text-muted-foreground"><p>Loading Chart...</p></div>;
    }

    if (expenses.length === 0) {
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
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={renderCustomizedLabel}
                    isAnimationActive={false} // Disabling animation as a final measure
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default memo(ExpensePieChartComponent);