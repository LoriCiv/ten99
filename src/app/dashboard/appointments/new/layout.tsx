// src/app/dashboard/appointments/new/layout.tsx
import React from 'react';

// This simple layout component just renders its children directly,
// overriding the parent dashboard layout.
export default function NewAppointmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  );
}