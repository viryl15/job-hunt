import { NextResponse } from 'next/server'

// Mock authentication for development
export async function GET() {
  return NextResponse.json({
    success: true,
    user: {
      id: 'dev-user-1',
      name: 'Dev User',
      email: 'dev@example.com',
      image: null,
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      locations: ['San Francisco, CA', 'Remote'],
      preferences: {
        remoteOnly: true,
        minSalary: 100000,
        preferredCompanies: ['TechCorp', 'StartupXYZ']
      }
    },
    session: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }
  })
}