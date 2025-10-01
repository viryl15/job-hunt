'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, TrendingUp, Shield } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Job Hunt</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="default">
                  Enter Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Privacy-First Job Hunting
            <span className="text-blue-600"> for Developers</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Take control of your job search with our intelligent scoring system, 
            automated applications, and privacy-conscious approach to finding your next role.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started (Dev Mode)
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Smart Job Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our algorithm scores jobs based on your skills, salary expectations, 
                and career level to surface the best matches first.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Automated Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Send personalized applications automatically with Gmail integration, 
                custom templates, and follow-up scheduling.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Privacy-Conscious</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data stays with you. Self-hosted option available, 
                with full control over your job search data and applications.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Jobs Analyzed Daily</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
              <div className="text-gray-600">Matching Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">3x</div>
              <div className="text-gray-600">Faster Applications</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24h</div>
              <div className="text-gray-600">Average Response Time</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
          <p className="text-xl opacity-90 mb-8">
            Join developers who have already streamlined their job hunting process
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Try Dashboard (Development Mode)
            </Button>
          </Link>
          <p className="text-sm opacity-75 mt-4">
            * OAuth setup required for production use
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Briefcase className="h-6 w-6" />
            <span className="text-xl font-bold">Job Hunt PWA</span>
          </div>
          <p className="text-gray-400">
            Privacy-conscious job hunting platform for developers
          </p>
        </div>
      </footer>
    </div>
  )
}
