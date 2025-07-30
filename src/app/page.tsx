// src/app/page.tsx (Landing page for non-signed-in users)
import { getTokenClaims } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bot, BarChart3, Users, Zap } from 'lucide-react';

export default async function LandingPage() {
  const claims = await getTokenClaims();

  // Redirect to signed-in home if authenticated
  if (claims && claims.sub) {
    redirect('/home');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <Link
              href="/login"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              Sign/Log In
            </Link>
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

            {/* CTA Buttons */}
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
                DeepSeek-powered insights to optimize your business performance and decision-making
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