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
      userId: 'test-user',
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
        autoApply: true,
        coverLetterTemplate: `Madame, Monsieur,

Je vous écris pour exprimer mon intérêt pour le poste de {{JOB_TITLE}} au sein de {{COMPANY_NAME}}.

Avec {{USER_EXPERIENCE}} d'expérience dans le développement logiciel et une expertise en {{SKILLS}}, je suis convaincu de pouvoir contribuer efficacement à vos projets.

Mes compétences techniques et ma passion pour l'innovation font de moi un candidat idéal pour rejoindre votre équipe.

Je serais ravi de discuter de ma candidature lors d'un entretien.

Cordialement,
{{USER_NAME}}`,
        maxApplicationsPerDay: 5,
        resumeUrl: '',
        customMessage: 'Test message'
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
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