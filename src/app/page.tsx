import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { auth } from '@clerk/nextjs/server';
import { Calendar, Users, FileText } from 'lucide-react';

export default async function WelcomePage() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
          <Image src="/logo.png" alt="Ten99 Logo" width={32} height={32} />
          <span className="ml-2 text-xl font-bold">Ten99</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {userId ? (
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Freelance Command Center
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Stop juggling apps. Manage your appointments, clients, and job files all in one place.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                 {userId ? (
                   <Button asChild size="lg">
                     <Link href="/dashboard">Go to Your Dashboard</Link>
                   </Button>
                 ) : (
                   <>
                     <Button asChild size="lg">
                       <Link href="/sign-up">Get Started for Free</Link>
                     </Button>
                     <Button asChild size="lg" variant="secondary">
                       <Link href="/sign-in">Sign In</Link>
                     </Button>
                   </>
                 )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}