'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the valid regions and areas
const regions = ["Kamrup M", "Kamrup", "Karbi Anglong", "Dehmaji"];
const areas = ["Guwahati", "Tezpur", "Diphu", "Nagaon", "Barpeta"];

export default function SetupCompanyForm() {
  const [companyName, setCompanyName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  // New state for region and area
  const [region, setRegion] = useState<string>(regions[0]);
  const [area, setArea] = useState<string>(areas[0]);

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
          // Include new fields in the request body
          region,
          area,
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
          Please provide your company's initial details. The first user will be
          created with the role of "senior-manager".
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              ref={companyNameRef}
              id="companyName"
              type="text"
              name="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="e.g., Acme Corp."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="officeAddress">Office Address</Label>
            <Textarea
              id="officeAddress"
              name="officeAddress"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              required
              rows={3}
              placeholder="Full street address, city, state, zip/postal code"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isHeadOffice"
              checked={isHeadOffice}
              onCheckedChange={(checked) => setIsHeadOffice(!!checked)}
            />
            <Label htmlFor="isHeadOffice" className="text-sm">
              Check If Head Office
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="1234567890"
            />
          </div>
          {/* New shadcn/ui Select components for Region and Area */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select onValueChange={setRegion} value={region}>
              <SelectTrigger>
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Area</Label>
            <Select onValueChange={setArea} value={area}>
              <SelectTrigger>
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Setting up...' : 'Save Company Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
