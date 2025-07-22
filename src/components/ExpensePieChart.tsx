// src/components/ExpensePieChart.tsx
"use client";

import { useMemo, useCallback, memo } from 'react';
import type { Expense } from '@/types/app-interfaces';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LabelProps {
    name: string;
    percent: number;
}

const renderCustomizedLabel = (props: LabelProps) => {
    const { percent } = props;
    if (percent && percent > 0.05) {
        return `${(percent * 100).toFixed(0)}%`;
    }
    return null;
};

// ... (rest of component) ...