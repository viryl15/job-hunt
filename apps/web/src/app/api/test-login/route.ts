import { NextRequest, NextResponse } from 'next/server'
import { RealHelloWorkAutomator } from '@/lib/real-hellowork-automation'
import { JobBoardConfig } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password, headless = true } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Testing HelloWork login with updated URL...')
    
    // Create test config
    const testConfig: JobBoardConfig = {
      id: `test-login-${Date.now()}`,
      boardName: 'HelloWork',
      boardUrl: 'https://www.hellowork.com',
      credentials: {
        email: email,
        password: password,
        username: email
      },
      preferences: {
        skills: ['JavaScript', 'TypeScript'],
        locations: ['Paris'],
        salaryMin: 30000,
        salaryMax: 60000,
        jobTypes: ['CDI'],
        experienceLevel: 'junior',
        remotePreference: 'any'
      },
      applicationSettings: {
        coverLetterTemplate: 'Test cover letter',
        maxApplicationsPerDay: 5,
        resumeUrl: '',
        customMessage: 'Test message'
      },
      isActive: true
    }

    // Test login
    const automator = new RealHelloWorkAutomator(testConfig)
    
    // Set environment variable for headless mode
    process.env.PUPPETEER_HEADLESS = headless ? 'true' : 'false'
    
    const loginResult = await automator.login()
    
    if (loginResult) {
      await automator.logout()
      return NextResponse.json({
        success: true,
        message: 'Login test successful!',
        details: {
          loginUrl: 'https://www.hellowork.com/fr-fr/candidat/connexion-inscription.html#connexion',
          loginSuccess: true
        }
      })
    } else {
      await automator.logout()
      return NextResponse.json({
        success: false,
        error: 'Login test failed',
        details: {
          loginUrl: 'https://www.hellowork.com/fr-fr/candidat/connexion-inscription.html#connexion',
          loginSuccess: false
        }
      })
    }

  } catch (error) {
    console.error('Login test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login test failed' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'HelloWork login test endpoint. Send POST with email and password to test login.',
    example: {
      method: 'POST',
      body: {
        email: 'your-email@example.com',
        password: 'your-password',
        headless: false
      }
    }
  })
}