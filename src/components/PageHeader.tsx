// src/components/PageHeader.tsx
"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 border-b pb-4">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}