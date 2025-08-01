// src/app/home/page.tsx (New signed-in version)
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  LayoutDashboard, 
  User, 
  ArrowRight,
  Bot,
  Building2
} from 'lucide-react';

interface CustomClaims {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown;
}

export default async function SignedInHomePage() {
  const claims = await getTokenClaims() as CustomClaims | null;

  // Redirect to landing page if not signed in
  if (!claims || !claims.sub) {
    redirect('/');
  }

  const user = {
    id: claims.sub,
    email: claims.email || '',
    firstName: typeof claims.given_name === 'string' ? claims.given_name : undefined,
    lastName: typeof claims.family_name === 'string' ? claims.family_name : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">CemTemBot CMS</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link> */}
              <Link
                href="/account/logout"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Log Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome back, <span className="text-primary">{user.firstName || 'User'}</span>!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose how you'd like to manage your company today with CemTemBot's intelligent tools
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* CemTem Chat Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer">
            <Link href="/home/cemtemChat" className="block h-full">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-chart-2 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">CemTem Chat</CardTitle>
                <CardDescription className="text-base">
                  Interact with your AI-powered assistant for instant help and automation
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <Button >
                  Start Chatting
                  <ArrowRight/>
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Dashboard Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer">
            <Link href="/dashboard" className="block h-full">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-chart-1 to-chart-3 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Dashboard</CardTitle>
                <CardDescription className="text-base">
                  Access your complete management suite with analytics and team oversight
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <Button >
                  View Dashboard
                  <ArrowRight />
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Account Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer">
            <Link href="/account" className="block h-full">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-chart-2 to-chart-4 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Account</CardTitle>
                <CardDescription className="text-base">
                  Manage your profile, company settings, and personal preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <Button >
                  Manage Account
                  <ArrowRight  />
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Quick Stats Section */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Quick Overview</h2>
            </div>
            <Link 
              href="/dashboard"
              className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              View Full Dashboard →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">AI Ready</div>
              <div className="text-muted-foreground">CemTemBot Status</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-2 mb-1">Active</div>
              <div className="text-muted-foreground">Account Status</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-3 mb-1">Premium</div>
              <div className="text-muted-foreground">Plan Type</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}