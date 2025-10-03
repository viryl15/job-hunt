import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for demo purposes (since database might not be set up)
let profileStorage: any = {
  config_1: {
    id: 'config_1',
    userId: 'user_1',
    boardName: 'hellowork',
    boardUrl: 'https://www.hellowork.com',
    credentials: {
      username: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      password: 'encrypted_password'
    },
    preferences: {
      skills: ['JavaScript', 'React', 'Node.js'],
      locations: ['Paris', 'Remote'],
      salaryMin: 45000,
      salaryMax: 65000,
      jobTypes: ['CDI'],
      experienceLevel: '3 ans',
      remotePreference: 'flexible'
    },
    applicationSettings: {
      autoApply: true,
      maxApplicationsPerDay: 10,
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
}

export async function POST(request: NextRequest) {
  try {
    const profileData = await request.json()
    
    // Update the existing profile configuration with profile data
    const configId = profileData.configId || 'config_1'
    
    // Get existing config from memory storage
    let existingConfig = profileStorage[configId]
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
        maxApplicationsPerDay: profileData.automation?.maxApplicationsPerDay || existingConfig.applicationSettings.maxApplicationsPerDay,
        resumeUrl: profileData.documents?.resumeUrl || existingConfig.applicationSettings.resumeUrl,
        customMessage: profileData.automation?.customMotivationMessage || existingConfig.applicationSettings.customMessage
      },
      updatedAt: new Date()
    }
    
    // Save updated config to memory
    profileStorage[configId] = updatedConfig
    
    console.log('✅ Profile updated successfully:', {
      name: updatedConfig.credentials.username,
      skills: updatedConfig.preferences.skills,
      experience: updatedConfig.preferences.experienceLevel
    })
    
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
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId') || 'config_1'
    
    const config = profileStorage[configId]
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
        phone: '',
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
        resumeUrl: config.applicationSettings.resumeUrl,
        portfolioUrl: ''
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
      error: 'Failed to fetch profile: ' + (error as Error).message 
    }, { status: 500 })
  }
}