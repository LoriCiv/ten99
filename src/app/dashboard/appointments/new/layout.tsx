// src/app/dashboard/appointments/new/layout.tsx

// This layout simply renders the page content that is passed to it.
// It inherits the main dashboard sidebar, header, and FirebaseProvider.
export default function NewAppointmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}