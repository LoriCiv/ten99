"use client";
import React, { useState } from 'react';

export default function App() {
  const [emailText, setEmailText] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
        setApiResponse(`Error from API: ${data.error || 'Unknown error'}`);
        setIsError(true);
      }
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
