// src/app/homes/signedOutHomePage.tsx (Client Component)
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SignedOutHomePage() {
  const handleLogin = () => {
    // This is the correct way to handle a client-side login redirect
    window.location.href = `/login`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold tracking-tight">Company CMS</CardTitle>
            <CardDescription className="mt-2 text-lg text-muted-foreground">
              Your centralized management system.
            </CardDescription>
            <Separator className="mt-4" />
          </CardHeader>
          <CardContent className="text-center p-6">
            <p className="text-xl text-muted-foreground">
              Hello and welcome to the Business CMS System. To get started, please log in or sign up.
            </p>
            <div className="mt-8">
              <Button
                onClick={handleLogin}
                className="w-full max-w-sm py-6 text-xl font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login / Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
