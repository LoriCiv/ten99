"use client";

import Modal from './Modal';
import FinancialTrendsChart from './FinancialTrendsChart';
import { X } from 'lucide-react';

interface TrendData {
  month: string;
  Income: number;
  Expenses: number;
}

interface FinancialTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TrendData[];
}

export default function FinancialTrendsModal({ isOpen, onClose, data }: FinancialTrendsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      {/* ✅ THE FIX: Added `bg-card` to this div to give it a solid background */}
      <div className="p-6 bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">YTD Financial Trends</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        <p className="text-muted-foreground mb-6">
          This chart shows your total paid income versus your total expenses for each month of the current year.
        </p>
        {/* The chart component itself remains unchanged */}
        <FinancialTrendsChart data={data} />
      </div>
    </Modal>
  );
}