import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">Ten99</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        this will be second to last, the dashboar .
      </p>
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
