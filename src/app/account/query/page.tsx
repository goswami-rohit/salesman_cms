// src/app/account/querry/page.tsx
'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function QueryPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/send-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send query.');
      }

      toast.success('Query Sent!', {
        description: 'Your query has been successfully sent to the developers.',
      });
      setSubject('');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending query:', error);
      toast.error('Error', {
        description: error.message || 'There was an issue sending your query. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Outer container: bg-background for the main page background
    <div className="flex items-center justify-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Card container: bg-card for the card background, text-card-foreground for text inside card */}
      <Card className="w-full max-w-md mx-auto rounded-lg shadow-lg bg-card text-card-foreground border-border">
        <CardHeader className="text-center">
          {/* Card title: text-card-foreground ensures it matches card's primary text color */}
          <CardTitle className="text-2xl font-bold text-card-foreground">Raise a Query</CardTitle>
          {/* Card description: text-muted-foreground for secondary text */}
          <CardDescription className="text-muted-foreground">
            Have a question or an issue? Send us a message directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              {/* Label: text-foreground for standard text */}
              <Label htmlFor="subject" className="text-foreground">Subject</Label>
              {/* Input: bg-input for input background, text-foreground for typed text, border-input for border, placeholder:text-muted-foreground for placeholder, focus-visible:ring-ring for focus glow */}
              <Input
                id="subject"
                type="text"
                placeholder="Brief summary of your query"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="rounded-md bg-input text-foreground border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message" className="text-foreground">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your query in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="resize-y rounded-md bg-input text-foreground border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              ></Textarea>
            </div>
            {/* Button: bg-primary for button background, text-primary-foreground for button text */}
            <Button
              type="submit"
              className="w-full rounded-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending Query...' : 'Send Query'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}