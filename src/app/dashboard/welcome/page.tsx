// src/app/dashboard/welcome/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function WelcomePage() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'user';
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'unauthorized') {
      toast.error("🚫 You do not have access to this page yet. Contact the admin/manager.");
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">🎉 Welcome to the Team!</CardTitle>
          <CardDescription>
            Hello, {name}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-lg">
            Your account has been successfully verified and added to the company.
            You now have access to features appropriate for your role.
          </p>
          <p className="text-sm text-gray-500">
            For access to additional features, please reach out to your administrator.
          </p>
          <Button asChild className="w-full">
            <Link href="/account/logout">Logout</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
