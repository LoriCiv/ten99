// src/app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Users, FileText } from 'lucide-react';

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
            <Image src="/logo.png" alt="Ten99 Logo" width={32} height={32} />
            <h1 className="text-2xl font-bold">Ten99</h1>
        </div>
        <Link href="/dashboard" className="bg-primary text-primary-foreground font-semibold py-2 px-5 rounded-lg hover:bg-primary/90 transition-colors">
            Sign In
        </Link>
      </header>

      <main>
        {/* Hero Section */}
        <section className="text-center py-20 px-6 bg-card border-b">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Your Professional Back Office.</h1>
            <p className="mt-6 text-lg max-w-2xl mx-auto text-muted-foreground">
                Finally, a tool built just for the independent contractor. Ten99 is the all-in-one command center that handles your admin, so you can focus on your craft.
            </p>
            <div className="mt-8">
                <Link href="/dashboard" className="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg hover:bg-primary/90 transition-colors">
                    Get Started for Free
                </Link>
            </div>
        </section>
        
        {/* "Your Command Center" Section with Images */}
        <section className="py-20 px-6 container mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="text-center md:text-left">
                    <h2 className="text-4xl font-bold">Your Command Center, In Your Pocket.</h2>
                    <p className="mt-4 text-muted-foreground">
                        Ten99 is designed to be your reliable partner on any device. Manage your entire business from your laptop at home, or from your phone on the go. All your data, always in sync.
                    </p>
                </div>
                <div className="relative h-80">
                    <Image 
                        src="/app-in-hand.jpg" 
                        alt="Ten99 app on a phone" 
                        fill 
                        className="object-contain rounded-lg"
                    />
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 container mx-auto bg-card rounded-lg border">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-4xl font-bold">Everything You Need, All in One Place.</h2>
                <p className="mt-4 text-muted-foreground">Ten99 was designed from the ground up to support every part of your business, from soup to nuts.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
                <FeatureCard icon={Calendar} title="Intelligent Scheduling">
                    Your calendar becomes a smart assistant. It consolidates every job request into one unified view, helping you manage your time like a pro.
                </FeatureCard>
                <FeatureCard icon={Users} title="Centralized Client Hub">
                    Give every client the VIP treatment. All notes, files, and project history are organized and instantly accessible for a seamless workflow.
                </FeatureCard>
                <FeatureCard icon={FileText} title="Effortless Invoicing">
                    Generate and send professional invoices with a single click. The app tracks your work, so you can bill with confidence and get paid faster.
                </FeatureCard>
            </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 px-6 border-y">
             <div className="text-center max-w-2xl mx-auto container">
                <h2 className="text-4xl font-bold">The Magic Is The Mailbox.</h2>
                <p className="mt-4 text-muted-foreground">Most tools expect you to adapt to them. Ten99 adapts to you. You don&apos;t enter data—you forward an email, and the app goes to work.</p>
            </div>
            <div className="mt-12 max-w-4xl mx-auto text-center">
                <p className="text-lg font-mono p-4 bg-muted rounded-lg border">
                    <span className="text-primary font-bold">Forward a client email</span> {'->'} Ten99 schedules the job, updates the client file, and syncs your calendar.
                </p>
            </div>
        </section>
        
        {/* Final CTA */}
         <section className="text-center py-20 px-6">
            <div className="container mx-auto">
                <Image src="/app-icon-detail.png" alt="Ten99 App Icon" width={80} height={80} className="mx-auto mb-6 rounded-2xl" />
                <h2 className="text-4xl font-bold">Ready to Elevate Your Business?</h2>
                <p className="mt-4 text-lg max-w-2xl mx-auto text-muted-foreground">
                    Give yourself the professional tools to match your professional talent.
                </p>
                <div className="mt-8">
                    <Link href="/dashboard" className="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg hover:bg-primary/90 transition-colors">
                        Start Your Free Trial
                    </Link>
                </div>
            </div>
        </section>
      </main>

       <footer className="text-center py-8 px-6 border-t bg-card">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Ten99 App. All rights reserved.</p>
       </footer>
    </div>
  );
}