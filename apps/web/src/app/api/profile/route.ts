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

    const profileData = await request.json()
    
    // Get user from database
    const user = await db.getUserByEmail(session.user.email!)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found. Please try signing in again.' 
      }, { status: 404 })
    }
    
    // Get user's job board config (create one if it doesn't exist)
    const configId = `config_${user.id}`
    
    // Get existing config or create default
    let existingConfig
    try {
      existingConfig = await db.getJobBoardConfig(configId)
      
      if (!existingConfig) {
        // Create a default config for the user
        existingConfig = {
          id: configId,
          userId: user.id,
          boardName: 'hellowork',
          boardUrl: 'https://www.hellowork.com',
          credentials: {
            username: user.name || 'User',
            email: user.email
          },
          preferences: {
            skills: [],
            locations: ['France'],
            experienceLevel: '3 ans',
            jobTypes: ['CDI'],
            remotePreference: 'flexible' as const,
            salaryMin: 40000,
            salaryMax: 80000
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
            useCustomTemplate: true,
            resumeUrl: '',
            customMessage: ''
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    } catch (dbError) {
      console.error('Database error, using fallback config:', dbError)
      existingConfig = {
        id: configId,
        userId: user.id,
        boardName: 'hellowork',
        boardUrl: 'https://www.hellowork.com',
        credentials: {
          username: user.name || 'User',
          email: user.email
        },
        preferences: {
          skills: [],
          locations: ['France'],
          experienceLevel: '3 ans',
          jobTypes: ['CDI'],
          remotePreference: 'flexible' as const,
          salaryMin: 40000,
          salaryMax: 80000
        },
        applicationSettings: {
          autoApply: false,
          maxApplicationsPerDay: 5,
          coverLetterTemplate: 'Template par défaut',
          useCustomTemplate: true,
          resumeUrl: '',
          customMessage: ''
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    
    if (!existingConfig) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuration not found' 
      }, { status: 404 })
    }
    
    // Update user profile information (name and phone)
    if (profileData.personalInfo) {
      const userUpdates: any = {}
      
      const fullName = `${profileData.personalInfo.firstName || ''} ${profileData.personalInfo.lastName || ''}`.trim()
      if (fullName) {
        userUpdates.name = fullName
      }
      
      if (profileData.personalInfo.phone) {
        userUpdates.phone = profileData.personalInfo.phone
      }
      
      if (Object.keys(userUpdates).length > 0) {
        await db.updateUser(user.id, userUpdates)
        console.log('✅ User profile updated:', userUpdates)
      }
    }

    // Update config with profile information
    const updatedConfig = {
      ...existingConfig,
      credentials: {
        ...existingConfig.credentials,
        username: `${profileData.personalInfo?.firstName || ''} ${profileData.personalInfo?.lastName || ''}`.trim() || existingConfig.credentials.username,
        email: profileData.personalInfo?.email || existingConfig.credentials.email
      },
      preferences: {
        ...existingConfig.preferences,
        skills: profileData.professional?.skills || existingConfig.preferences.skills,
        locations: profileData.preferences?.preferredLocations || existingConfig.preferences.locations,
        experienceLevel: profileData.professional?.experience || existingConfig.preferences.experienceLevel,
        jobTypes: profileData.preferences?.jobTypes || existingConfig.preferences.jobTypes,
        salaryMin: profileData.preferences?.salaryRange?.min || existingConfig.preferences.salaryMin,
        salaryMax: profileData.preferences?.salaryRange?.max || existingConfig.preferences.salaryMax,
        remotePreference: profileData.preferences?.workArrangement || existingConfig.preferences.remotePreference
      },
      applicationSettings: {
        ...existingConfig.applicationSettings,
        coverLetterTemplate: profileData.documents?.coverLetterTemplate || existingConfig.applicationSettings.coverLetterTemplate,
        useCustomTemplate: profileData.automation?.useCustomTemplate !== undefined ? profileData.automation.useCustomTemplate : existingConfig.applicationSettings.useCustomTemplate,
        maxApplicationsPerDay: profileData.automation?.maxApplicationsPerDay || existingConfig.applicationSettings.maxApplicationsPerDay,
        resumeUrl: profileData.documents?.resumeUrl || existingConfig.applicationSettings.resumeUrl,
        customMessage: profileData.automation?.customMotivationMessage || existingConfig.applicationSettings.customMessage
      },
      updatedAt: new Date()
    }
    
    // Save updated config
    try {
      await db.saveJobBoardConfig(updatedConfig)
      console.log('✅ Profile saved to database')
    } catch (dbError) {
      console.warn('⚠️ Could not save to database:', dbError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      config: updatedConfig
    })
    
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update profile: ' + (error as Error).message 
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

    // Get user from database
    const user = await db.getUserByEmail(session.user.email!)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }
    
    const configId = `config_${user.id}`
    
    let config
    try {
      config = await db.getJobBoardConfig(configId)
    } catch (dbError) {
      console.error('Database error in GET, using fallback:', dbError)
      // Fallback config with user's real data
      config = {
        id: configId,
        userId: user.id,
        boardName: 'hellowork',
        boardUrl: 'https://www.hellowork.com',
        credentials: {
          username: user.name || 'User',
          email: user.email
        },
        preferences: {
          skills: [],
          locations: ['France'],
          experienceLevel: '3 ans',
          jobTypes: ['CDI'],
          remotePreference: 'flexible' as const,
          salaryMin: 40000,
          salaryMax: 80000
        },
        applicationSettings: {
          autoApply: false,
          maxApplicationsPerDay: 5,
          coverLetterTemplate: 'Template par défaut',
          useCustomTemplate: true,
          resumeUrl: '',
          customMessage: ''
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    
    if (!config) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuration not found' 
      }, { status: 404 })
    }
    
    // Convert config to user profile format
    const userProfile = {
      personalInfo: {
        firstName: config.credentials.username?.split(' ')[0] || user.name?.split(' ')[0] || '',
        lastName: config.credentials.username?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join(' ') || '',
        email: config.credentials.email || user.email,
        phone: user.phone || '',
        city: config.preferences.locations?.[0] || '',
        country: 'France'
      },
      professional: {
        currentTitle: 'Développeur',
        experience: config.preferences.experienceLevel || '3 ans',
        skills: config.preferences.skills || [],
        languages: [
          { language: 'Français', level: 'natif' },
          { language: 'Anglais', level: 'avancé' }
        ],
        education: [],
        certifications: []
      },
      preferences: {
        desiredTitles: [],
        preferredLocations: config.preferences.locations || [],
        salaryRange: {
          min: config.preferences.salaryMin || 40000,
          max: config.preferences.salaryMax || 80000,
          currency: 'EUR'
        },
        jobTypes: config.preferences.jobTypes || ['CDI'],
        workArrangement: config.preferences.remotePreference || 'flexible',
        willingToRelocate: false
      },
      documents: {
        coverLetterTemplate: config.applicationSettings.coverLetterTemplate || '',
        resumeUrl: config.applicationSettings.resumeUrl || '',
        portfolioUrl: ''
      },
      automation: {
        autoApplyEnabled: config.applicationSettings.autoApply || false,
        useCustomTemplate: config.applicationSettings.useCustomTemplate !== undefined ? config.applicationSettings.useCustomTemplate : true,
        maxApplicationsPerDay: config.applicationSettings.maxApplicationsPerDay || 5,
        customMotivationMessage: config.applicationSettings.customMessage || '',
        skipCompanies: []
      }
    }
    
    return NextResponse.json({
      success: true,
      profile: userProfile,
      config: config
    })
    
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch profile: ' + (error as Error).message 
    }, { status: 500 })
  }
}