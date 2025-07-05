// Forcing a final save
"use client";
import React from 'react';

import { useState } from 'react';

export default function App() {
  const [emailText, setEmailText] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setApiResponse('');
    setIsError(false);

    if (!emailText.trim()) {
        setApiResponse('Please paste some email text before submitting.');
        setIsError(true);
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('https://api.ten99.app/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailText }),
      });

      const data = await response.json();

      if (response.ok) {
        const cleanedResponse = data.aiResponse.replace(/```json\n|\n```/g, '');
        setApiResponse(JSON.stringify(JSON.parse(cleanedResponse), null, 2));
      } else {
        setApiResponse(`Error from API: ${data.error}`);
        setIsError(true);
    } catch {
  setApiResponse(`Error: Failed to connect to the API. Please try again.`);
  setIsError(true);
}

    setIsLoading(false);
  };

  return (
    <div className="bg-gray-50 font-sans antialiased text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">Ten99</div>
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

      <main className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Your Freelancing, Simplified.
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Ten99 is the all-in-one platform that automates your invoicing, tracks
          expenses, and prepares you for tax time, so you can focus on what you
          do best.
        </p>
        <div className="mt-8">
          <a
            href="#process"
            className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-indigo-700 transition-colors duration-300 shadow-lg"
          >
            Get Started for Free
          </a>
        </div>
      </main>

      <section id="process" className="bg-white py-24">
        <div className="container mx-auto px-6 max-w-xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Process an Email</h2>
            <p className="mt-4 text-lg text-gray-600">
              Paste the body of a job offer email below to see the magic.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-2xl">
            <form onSubmit={handleSubmit}>
              <textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                className="w-full h-40 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Paste email text here..."
              ></textarea>
              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Extract Appointment Info'}
              </button>
            </form>
            {apiResponse && (
              <div className="mt-6 text-left">
                <h3 className="font-semibold text-gray-800">Result:</h3>
                <pre className={`mt-2 p-4 bg-gray-100 rounded-md whitespace-pre-wrap ${isError ? 'text-red-600' : ''}`}>
                  {apiResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Ten99. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
