// src/app/setup-company/SetupCompanyForm.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupCompanyForm() {
  const [companyName, setCompanyName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyNameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (companyNameRef.current) {
        companyNameRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/setup-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          officeAddress,
          isHeadOffice,
          phoneNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set up company. Please try again.');
      }

      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during setup.');
      console.error('Company setup submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md border border-border">
        <h1 className="text-2xl font-bold mb-6 text-center text-card-foreground">
          Set Up Your Company Profile
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Please provide your company's initial details.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-foreground">
              Company Name
            </label>
            <input
              ref={companyNameRef}
              type="text"
              id="companyName"
              name="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
              className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border sm:text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Acme Corp."
            />
          </div>
          <div>
            <label htmlFor="officeAddress" className="block text-sm font-medium text-foreground">
              Office Address
            </label>
            <textarea
              id="officeAddress"
              name="officeAddress"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              required
              rows={3}
              className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border sm:text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Full street address, city, state, zip/postal code"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isHeadOffice"
              name="isHeadOffice"
              checked={isHeadOffice}
              onChange={(e) => setIsHeadOffice(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-ring border-border rounded"
            />
            <label htmlFor="isHeadOffice" className="ml-2 block text-sm text-foreground">
              Check If Head Office
            </label>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-border sm:text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="1234567890"
            />
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Setting up...' : 'Save Company Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}