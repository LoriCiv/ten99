// We add 'use client' at the top to tell Next.js this is an interactive component
'use client'; 

import React, { useState } from 'react';

// --- Helper Components for better structure ---

// Icon component for features - with TypeScript types
const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center">
    {children}
  </div>
);

// Feature card component - with TypeScript types
const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-start">
      <FeatureIcon>{icon}</FeatureIcon>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-base text-gray-600">{children}</p>
      </div>
    </div>
  </div>
);

// --- NEW: AI Processor Component ---
const AIProcessor = () => {
  const [emailText, setEmailText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add type for the form event
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult('');

    // Construct the API URL with the email text as a query parameter
    // This calls the Vercel function we built earlier.
    const apiUrl = `/api/extract?text=${encodeURIComponent(emailText)}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.text(); // Get the raw text response
      setResult(data);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setResult('Failed to connect to the AI processor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-indigo-50 p-8 rounded-lg shadow-inner">
      <h3 className="text-2xl font-bold text-center text-gray-900">Process an Email</h3>
      <p className="text-center text-gray-600 mt-2">Paste the body of a job offer email below to see the magic.</p>
      <form onSubmit={handleSubmit} className="mt-6">
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          placeholder="Paste email text here..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-300"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Extract Appointment Info'}
        </button>
      </form>
      {result && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h4 className="font-semibold text-gray-800">Result:</h4>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-sm text-gray-700 whitespace-pre-wrap break-all">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};


// Main Page Component
export default function HomePage() {
  return (
    <div className="bg-gray-50 font-sans antialiased text-gray-800">
      {/* --- Header --- */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">
            Ten99
          </div>
          <div>
            <a
              href="#"
              className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
            >
              Sign In
            </a>
          </div>
        </nav>
      </header>

      {/* --- Hero Section --- */}
      <main className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Your Freelancing, Simplified.
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Ten99 is the all-in-one platform that automates your invoicing, tracks expenses, and prepares you for tax time, so you can focus on what you do best.
        </p>
        <div className="mt-8">
          <a
            href="#"
            className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-indigo-700 transition-colors duration-300 shadow-lg"
          >
            Get Started for Free
          </a>
        </div>
      </main>
      
      {/* --- NEW: Interactive AI Section --- */}
      <section className="py-16">
          <div className="container mx-auto px-6 max-w-3xl">
              <AIProcessor />
          </div>
      </section>

      {/* --- Features Section --- */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">The Power to Be Your Own Boss</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to manage your independent business with confidence.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              }
              title="AI-Powered Inbox"
            >
              Forward job emails and let our AI extract the details, creating draft appointments and client profiles automatically.
            </FeatureCard>
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              }
              title="Effortless Invoicing"
            >
              Generate and send professional invoices in seconds. Track payments and get paid faster with online payment integrations.
            </FeatureCard>
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              }
              title="Smart Expense Tracking"
            >
              Never miss a deduction. Capture receipts on the go and automatically categorize expenses to maximize your tax savings.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Ten99. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

