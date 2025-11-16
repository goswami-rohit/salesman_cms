// src/app/login/magicAuth/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// Assume your components/ui are available for Input, Button, Card, Separator, etc.
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { BASE_URL } from '@/lib/Reusable-constants';

function MagicAuthForm() {
    //const router = useRouter();
    const searchParams = useSearchParams();

    // Read email and invitation token from the URL query params
    const token = searchParams.get('inviteKey');
    const emailFromUrl = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailFromUrl);
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const isEmailStep = step === 'email';

    // 1. Initiate Magic Auth (POST to /api/auth/magic-auth/create)
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        try {
            // *** UPDATED ENDPOINT: Use the dedicated CREATE route ***
            const response = await fetch(`/auth/magic-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to send login code.');
            } else {
                setMessage(data.message || 'Check your email for the 6-digit code.');
                setStep('code');
            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Verify Code and Log In (POST to /api/auth/magic-auth/verify)
    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (code.length !== 6) {
            setError('The code must be 6 digits long.');
            setLoading(false);
            return;
        }

        try {
            // *** UPDATED ENDPOINT: Use the dedicated VERIFY route ***
            const response = await fetch(`/auth/magic-auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    code,
                    invitationToken: token // Pass the token here for invitation acceptance (local linking)
                }),
            });

            // NOTE: On successful login, the browser will usually follow the 307/302 redirect 
            // from the backend automatically, skipping this block.

            const data = await response.json();

            if (response.ok && data.redirectUrl) {
                // Instead of client-side router.push, use window.location.href 
                // to force a full browser navigation. This allows the middleware 
                // to correctly handle the AuthKit redirect without conflict.
                setMessage('Account successfully activated. Redirecting for final login...');
                window.location.href = data.redirectUrl;
                return;
            }

            if (!response.ok) {
                setError(data.error || 'Invalid code or authentication failed. Please try again.');
            }

            // The browser will typically redirect before reaching the 'else' if sealedSession worked.
            // If the code reaches here and response.ok is true, something unexpected happened.

        } catch (err) {
            console.error(err);
            setError('An unexpected network error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    // Construct the Google SSO redirect URL with the invitation token
    // This assumes your standard WorkOS login route (/login) can accept an 'invitation_token' 
    // to ensure the user is accepted into the organization after successful SSO.
    const googleSsoUrl = `/login?invitation_token=${token}`;


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <Mail className="h-6 w-6 text-primary" />
                        {isEmailStep ? 'Accept Invitation' : 'Enter Login Code'}
                    </CardTitle>
                    <CardDescription>
                        {isEmailStep ? 'Enter your invited email address to receive your one-time login code.' : message || 'Check your inbox for the 6-digit code.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="flex items-center p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900 dark:text-red-400" role="alert">
                            <AlertCircle className="shrink-0 inline w-4 h-4 mr-3" />
                            <span className="sr-only">Error</span>
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={isEmailStep ? handleEmailSubmit : handleCodeSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                                disabled={loading || step === 'code'}
                            />
                        </div>

                        {step === 'code' && (
                            <div className="space-y-2">
                                <Label htmlFor="code">6-Digit Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEmailStep ? 'Send Login Code' : 'Log In'}
                        </Button>
                    </form>

                    <Separator className="my-6" />

                    <div className="space-y-3">
                        <p className="text-center text-sm font-semibold text-gray-700 dark:text-red-400">
                            IF YOU ARE INVITED ON A GOOGLE MAIL ACCOUNT:
                        </p>

                        {/* Google SSO Button with token passed */}
                        <Link href={googleSsoUrl} passHref>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={loading}
                            >
                                Sign In using Google
                            </Button>
                        </Link>

                        <div className="text-center text-sm text-gray-500 pt-2">
                            Using the Google option will automatically accept your invitation.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// This prevents the server from attempting to render useSearchParams() during the static build.
export default function MagicAuthPage() {
    const fallbackUI = (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <Suspense fallback={fallbackUI}>
            <MagicAuthForm />
        </Suspense>
    );
}