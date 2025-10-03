import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Check if user already exists
    let user = await db.getUserByEmail(session.user.email!)
    
    if (!user) {
      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      await db.createUser({
        id: userId,
        email: session.user.email!,
        name: session.user.name || '',
        image: session.user.image || '',
        provider: 'google',
        providerId: session.user.id || ''
      })
      
      user = await db.getUserByEmail(session.user.email!)
      
      // Create a default job board config for the new user
      const defaultConfig = {
        id: `config_${userId}`,
        userId: userId,
        boardName: 'HelloWork',
        boardUrl: 'https://www.hellowork.com',
        credentials: {
          email: session.user.email!,
          username: session.user.name || '',
          password: ''
        },
        preferences: {
          skills: [],
          locations: ['France'],
          salaryMin: 40000,
          salaryMax: 80000,
          jobTypes: ['CDI'],
          experienceLevel: 'Mid-level',
          remotePreference: 'hybrid' as const
        },
        applicationSettings: {
          autoApply: false,
          maxApplicationsPerDay: 5,
          coverLetterTemplate: `Madame, Monsieur,

Je vous écris pour exprimer mon intérêt pour le poste de {{JOB_TITLE}} au sein de {{COMPANY_NAME}}.

Avec {{USER_EXPERIENCE}} d'expérience dans le développement logiciel et une expertise en {{SKILLS}}, je suis convaincu de pouvoir contribuer efficacement à vos projets.

Mes compétences techniques et ma passion pour l'innovation font de moi un candidat idéal pour rejoindre votre équipe.

Je serais ravi de discuter de ma candidature lors d'un entretien.

Cordialement,
{{USER_NAME}}`,
          resumeUrl: '',
          customMessage: ''
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.saveJobBoardConfig(defaultConfig)
    } else {
      // Update last login
      await db.updateUser(user.id, { 
        lastLoginAt: new Date(),
        name: session.user.name || user.name,
        image: session.user.image || user.image
      })
    }
    
    return NextResponse.json({
      success: true,
      user: user,
      message: user ? 'User updated' : 'User created'
    })
    
  } catch (error) {
    console.error('User creation/update error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create/update user: ' + (error as Error).message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const user = await db.getUserByEmail(session.user.email!)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      user: user
    })
    
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user: ' + (error as Error).message 
    }, { status: 500 })
  }
}