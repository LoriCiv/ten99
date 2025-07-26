"use client";

import React, { ComponentProps } from 'react';
import { DayPicker, DayContent } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; 
import '@/styles/calendar.css'; 
import { Download, LocateFixed } from 'lucide-react';
import * as ics from 'ics';
import type { Appointment } from '@/types/app-interfaces';
import { format } from 'date-fns';

function CustomDayContent(props: ComponentProps<typeof DayContent>) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <span>{format(props.date, "d")}</span>
      <div className="absolute bottom-1 flex items-center space-x-1">
        {props.activeModifiers.job && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
        {props.activeModifiers.personal && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
        {props.activeModifiers.billing && <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>}
      </div>
    </div>
  );
}

interface InteractiveCalendarProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

export default function InteractiveCalendar({
  appointments,
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange
}: InteractiveCalendarProps) {
  
  const jobDays = appointments.filter(a => (a.eventType || 'job') === 'job').map(a => new Date(a.date + 'T00:00:00'));
  const personalDays = appointments.filter(a => a.eventType === 'personal').map(a => new Date(a.date + 'T00:00:00'));
  const billingDays = appointments.filter(a => a.eventType === 'billing').map(a => new Date(a.date + 'T00:00:00'));

  const modifiers = {
    job: jobDays,
    personal: personalDays,
    billing: billingDays,
  };

  const handleExport = () => {
    const eventsForMonth = appointments.filter(appt => {
        const apptDate = new Date(appt.date);
        return apptDate.getMonth() === currentMonth.getMonth() && apptDate.getFullYear() === currentMonth.getFullYear();
    });
    if (eventsForMonth.length === 0) {
        alert("No appointments in the current month to export.");
        return;
    }
    const icsEvents = eventsForMonth.map(appt => {
        const [year, month, day] = appt.date.split('-').map(Number);
        const [hour, minute] = appt.time.split(':').map(Number);
        let duration: ics.DurationObject = { hours: 1 };
        if (appt.endTime) {
            const end = new Date(appt.date + 'T' + appt.endTime);
            const start = new Date(appt.date + 'T' + appt.time);
            const diffMinutes = (end.getTime() - start.getTime()) / 60000;
            if (diffMinutes > 0) duration = { minutes: diffMinutes };
        }
        return {
            title: appt.subject,
            start: [year, month, day, hour, minute] as ics.DateArray,
            duration,
            location: appt.address || appt.virtualLink || 'N/A',
        };
    });
    const { error, value } = ics.createEvents(icsEvents);
    if (error || !value) {
      console.error(error);
      alert("Failed to create calendar file.");
      return;
    }
    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ten99_appointments_${currentMonth.getFullYear()}_${currentMonth.getMonth() + 1}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleGoToToday = () => {
    const today = new Date();
    onMonthChange(today);
    onDateSelect(today);
  };

  return (
    <div className="bg-card p-4 sm:p-6 rounded-lg border">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        month={currentMonth}
        onMonthChange={onMonthChange}
        showOutsideDays
        modifiers={modifiers}
        components={{
          DayContent: CustomDayContent
        }}
        modifiersClassNames={{
            selected: 'selected-day'
        }}
      />
      <div className="w-full flex justify-between items-center mt-4 pt-4 border-t border-border/50 px-4 pb-2">
        <button onClick={handleGoToToday} className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-primary transition-colors"><LocateFixed size={16} /> Go to Today</button>
        <button onClick={handleExport} className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-primary transition-colors"><Download size={16} /> Export Month</button>
      </div>
    </div>
  );
}