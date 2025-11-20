'use client';

//import Link from 'next/link';
import { Bot, BarChart3, Users, Zap, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming this is still used for the Button component
import Image from 'next/image';

export default function SignedOutHomePage() {
  const handleLogin = () => {
    // This is the correct way to handle a client-side login redirect
    //window.location.href = `/login`;
    window.location.href = `/login/magicAuth`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <Image
                src="/bestcement.webp"
                alt='Best Cement Logo'
                width={32}  // 32px
                height={32} // 32px
                className="rounded-lg object-cover" // Keeps it rounded
              />
              <span className="text-xl font-bold text-foreground">Best Cement CMS</span>
            </div>
            {/* The login button from the old design */}
            <Button
              onClick={handleLogin}
              className="bg-foreground text-background px-4 py-2 rounded-md hover:bg-(--primary-hover) transition-opacity"
            >
              Sign/Log In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center">
          <div className="space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary">
                Company
                <br />
                Management System
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Your centralized management system. To get started, please log in or sign up.
              </p>
            </div>

            {/* CTA Button */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleLogin}
                  className="inline-flex items-center px-8 py-4 bg-foreground text-background rounded-md font-medium text-lg hover:bg-(--primary-hover) transition-opacity"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Get Started
                </Button>
              </div>
            </div>
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
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Smart Analytics</h3>
              <p className="text-muted-foreground">
                CemTemBot AI Chat-powered insights to optimize your business performance and decision-making
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Team Management</h3>
              <p className="text-muted-foreground">
                Comprehensive tools for organizing teams, roles, and permissions across your organization
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">AI Automation</h3>
              <p className="text-muted-foreground">
                Automate routine tasks and workflows with CemTemBot's intelligent processing capabilities
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="text-center">
          <p className="text-muted-foreground">
            © 2025 Made By Brixta
          </p>
        </div>
      </footer>
    </div>
  );
}
