// src/app/home/page.tsx
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import Link from 'next/link';

interface CustomClaims {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    [key: string]: unknown;
}

interface AppUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

export default async function HomePage() {
    const claims = await getTokenClaims() as CustomClaims | null;

    const user: AppUser | null = claims && claims.sub && claims.email ? {
        id: claims.sub,
        email: claims.email,
        firstName: typeof claims.given_name === 'string' ? claims.given_name : undefined,
        lastName: typeof claims.family_name === 'string' ? claims.family_name : undefined,
    } : null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation Header */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-sm">C</span>
                            </div>
                            <span className="text-xl font-bold text-foreground">CemTemBot CMS</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-20 text-center">
                    <div className="space-y-8">
                        {/* Main Heading */}
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                                <span className="text-foreground">Company</span>
                                <br />
                                <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                                    Management System
                                </span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                Powered by <span className="text-primary font-semibold">CemTemBot</span> with
                                <span className="text-chart-2 font-semibold"> DeepSeek AI</span> capabilities.
                                Streamline your business operations with intelligent automation and comprehensive management tools.
                            </p>
                        </div>

                        {/* User-specific content */}
                        {user ? (
                            <div className="space-y-6">
                                <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto">
                                    <p className="text-card-foreground mb-4">
                                        Welcome back, <span className="font-semibold text-primary">{user.firstName || user.email}</span>!
                                    </p>
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Continue to Dashboard
                                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-md font-medium text-lg hover:opacity-90 transition-opacity"
                                    >
                                        Get Started
                                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                    <button className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground rounded-md font-medium text-lg hover:opacity-90 transition-opacity">
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-20">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Intelligent Business Management</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Harness the power of AI-driven insights and automation for your company operations
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">Smart Analytics</h3>
                            <p className="text-muted-foreground">
                                DeepSeek-powered insights to optimize your business performance and decision-making
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                            <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-chart-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">Team Management</h3>
                            <p className="text-muted-foreground">
                                Comprehensive tools for organizing teams, roles, and permissions across your organization
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                            <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-chart-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2">AI Automation</h3>
                            <p className="text-muted-foreground">
                                Automate routine tasks and workflows with CemteBot's intelligent processing capabilities
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-border py-12">
                    <div className="text-center">
                        <p className="text-muted-foreground">
                            © 2025 CemteBot Company Management System.
                            <span className="text-primary"> Powered by DeepSeek AI</span>
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}