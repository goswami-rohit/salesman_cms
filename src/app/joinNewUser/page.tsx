// src/app/joinNewUser/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function JoinPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(false);

    const handleJoinTeam = async () => {
        setLoading(true);
        // Pass token through login URL so it survives WorkOS redirect
        window.location.href = `/login?inviteToken=${token}`;
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>Invalid Invitation</CardTitle>
                        <CardDescription>This invitation link is invalid or has expired.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/home')} className="w-full">Go to Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Join the Team!</CardTitle>
                    <CardDescription>You've been invited to join a company. Sign in to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleJoinTeam} disabled={loading} className="w-full">
                        {loading ? 'Redirecting...' : 'Sign In to Join Team'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function JoinPage() {
    return (
        // Wrap the component that uses useSearchParams with Suspense
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>Loading Invitation...</CardTitle>
                        <CardDescription>Please wait while we process your invitation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* You can add a spinner or more elaborate loading UI here */}
                        <div className="flex justify-center items-center py-8">Loading...</div> 
                    </CardContent>
                </Card>
            </div>
        }>
            <JoinPageContent />
        </Suspense>
    );
}