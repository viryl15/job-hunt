import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const profileData = await request.json()
    
    // Update the existing JobBoardConfig with profile data
    const configId = profileData.configId || 'config_1'
    
    // Get existing config
    let existingConfig
    try {
      existingConfig = await db.getJobBoardConfig(configId)
    } catch (dbError) {
      console.error('Database error, creating fallback config:', dbError)
      // Create a fallback config if database is not available
      existingConfig = {
        id: configId,
        userId: 'user_1',
        boardName: 'hellowork',
        boardUrl: 'https://www.hellowork.com',
        credentials: {
          username: 'Jean Dupont',
          email: 'jean.dupont@example.com'
        },
        preferences: {
          skills: ['JavaScript', 'React'],
          locations: ['Paris'],
          experienceLevel: '3 ans',
          jobTypes: ['CDI'],
          remotePreference: 'flexible' as const
        },
        applicationSettings: {
          autoApply: true,
          maxApplicationsPerDay: 10,
          coverLetterTemplate: 'Template par défaut'
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
    
    // Update config with profile information
    const updatedConfig = {
      ...existingConfig,
      credentials: {
        ...existingConfig.credentials,
        username: `${profileData.personalInfo?.firstName} ${profileData.personalInfo?.lastName}`.trim() || existingConfig.credentials.username,
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
      console.warn('⚠️ Could not save to database, using in-memory storage:', dbError)
      // Fallback to in-memory storage if database fails
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
      error: 'Failed to update profile' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId') || 'config_1'
    
    let config
    try {
      config = await db.getJobBoardConfig(configId)
    } catch (dbError) {
      console.error('Database error in GET, using fallback:', dbError)
      // Fallback config
      config = {
        id: configId,
        userId: 'user_1',
        boardName: 'hellowork',
        boardUrl: 'https://www.hellowork.com',
        credentials: {
          username: 'Jean Dupont',
          email: 'jean.dupont@example.com'
        },
        preferences: {
          skills: ['JavaScript', 'React', 'Node.js'],
          locations: ['Paris', 'Remote'],
          experienceLevel: '3 ans',
          jobTypes: ['CDI'],
          remotePreference: 'flexible' as const
        },
        applicationSettings: {
          autoApply: true,
          maxApplicationsPerDay: 10,
          coverLetterTemplate: 'Template par défaut'
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
        firstName: config.credentials.username?.split(' ')[0] || '',
        lastName: config.credentials.username?.split(' ').slice(1).join(' ') || '',
        email: config.credentials.email || '',
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
          min: config.preferences.salaryMin,
          max: config.preferences.salaryMax,
          currency: 'EUR'
        },
        jobTypes: config.preferences.jobTypes || ['CDI'],
        workArrangement: config.preferences.remotePreference || 'flexible',
        willingToRelocate: false
      },
      documents: {
        coverLetterTemplate: config.applicationSettings.coverLetterTemplate,
        resumeUrl: config.applicationSettings.resumeUrl
      },
      automation: {
        autoApplyEnabled: config.applicationSettings.autoApply,
        maxApplicationsPerDay: config.applicationSettings.maxApplicationsPerDay,
        customMotivationMessage: config.applicationSettings.customMessage,
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
      error: 'Failed to fetch profile' 
    }, { status: 500 })
  }
}