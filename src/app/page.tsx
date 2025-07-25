// src/app/page.tsx
import Link from 'next/link';
import { ThumbsUp, Calendar, Users, FileText, BarChart2 } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div className="bg-card p-6 rounded-lg border">
        <Icon className="h-8 w-8 text-primary mb-4" />
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{children}</p>
    </div>
);

export default function WelcomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <ThumbsUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Ten99</h1>
        </div>
        <Link href="/dashboard" className="bg-primary text-primary-foreground font-semibold py-2 px-5 rounded-lg hover:bg-primary/90 transition-colors">
            Sign In
        </Link>
      </header>

      <main>
        {/* Hero Section */}
        <section className="text-center py-20 px-6 bg-card border-b">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Your Freelancing, Simplified.</h1>
            <p className="mt-6 text-lg max-w-2xl mx-auto text-muted-foreground">
                Ten99 consolidates your calendar, clients, and invoicing into a single, smart platform. Stop missing jobs, stop chasing payments, and get back to the work you love.
            </p>
            <div className="mt-8">
                <Link href="/dashboard" className="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg hover:bg-primary/90 transition-colors">
                    Get Started for Free
                </Link>
            </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-6 container mx-auto">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-4xl font-bold">Go from Scattered to Streamlined.</h2>
                <p className="mt-4 text-muted-foreground">You juggle everything. Ten99 brings it all together, starting with what matters most.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
                <FeatureCard icon={Calendar} title="Never Miss a Booking">
                    Forward a client email and Ten99 automatically reads it, creates an appointment, and checks for conflicts in your unified calendar.
                </FeatureCard>
                <FeatureCard icon={Users} title="A Perfect Memory for Every Client">
                    A centralized hub for every client. Every email, note, and job file is organized and instantly accessible. No more searching.
                </FeatureCard>
                <FeatureCard icon={FileText} title="Get Paid Without the Paperwork">
                    Automatically generate and send professional invoices the moment a job is done. Stop leaving money on the table.
                </FeatureCard>
            </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 px-6 bg-card border-y">
             <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-4xl font-bold">The Magic Is The Mailbox.</h2>
                <p className="mt-4 text-muted-foreground">Most tools expect you to adapt to them. Ten99 adapts to you. You don&apos;t enter data—you forward an email, and the app goes to work.</p>
            </div>
            <div className="mt-12 max-w-4xl mx-auto text-center">
                <p className="text-lg font-mono p-4 bg-muted rounded-lg border">
                    <span className="text-primary font-bold">Forward an email to your app</span> {'->'} Creates an Appointment {'->'} Updates the Client Record {'->'} Syncs Your Calendar
                </p>
            </div>
        </section>
        
        {/* Final CTA */}
         <section className="text-center py-20 px-6">
            <h2 className="text-4xl font-bold">Ready to take control?</h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto text-muted-foreground">
                Get the peace of mind to focus on the work you love.
            </p>
            <div className="mt-8">
                <Link href="/dashboard" className="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg hover:bg-primary/90 transition-colors">
                    Start Your Free Trial
                </Link>
            </div>
        </section>
      </main>

       <footer className="text-center py-8 px-6 border-t bg-card">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Ten99 App. All rights reserved.</p>
       </footer>
    </div>
  );
}