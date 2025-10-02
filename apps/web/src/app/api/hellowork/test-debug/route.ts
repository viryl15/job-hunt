import { NextResponse } from 'next/server'
import { RealHelloWorkAutomator } from '@/lib/real-hellowork-automation'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const automation = new RealHelloWorkAutomator({
      id: 'debug-test',
      userId: 'debug-user',
      boardName: 'HelloWork',
      boardUrl: 'https://www.hellowork.com',
      credentials: {
        username: email,
        password: password
      },
      preferences: {
        skills: ['developer'],
        locations: ['Paris'],
        jobTypes: ['full-time'],
        experienceLevel: 'mid',
        remotePreference: 'any'
      },
      applicationSettings: {
        maxApplicationsPerDay: 10,
        autoApply: false
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Test run to debug login button issue
    const result = await automation.testLoginButtonDetection(email, password)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Login button detection test completed',
      debugInfo: result
    })
  } catch (error) {
    console.error('HelloWork automation error:', error)
    return NextResponse.json({ 
      error: 'Automation failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}