// User Profile Management System
export interface UserProfile {
  id: string
  userId: string
  
  // Personal Information
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    dateOfBirth?: Date
    nationality?: string
    address?: {
      street?: string
      city: string
      postalCode?: string
      country: string
    }
  }
  
  // Professional Information
  professional: {
    currentTitle: string
    experience: string // "2 ans", "5 ans", etc.
    skills: string[]
    languages: Array<{
      language: string
      level: 'débutant' | 'intermédiaire' | 'avancé' | 'natif'
    }>
    education: Array<{
      degree: string
      institution: string
      year: number
      field?: string
    }>
    certifications: Array<{
      name: string
      issuer: string
      date: Date
      expirationDate?: Date
    }>
  }
  
  // Job Preferences
  preferences: {
    desiredTitles: string[]
    preferredLocations: string[]
    salaryRange: {
      min?: number
      max?: number
      currency: string
    }
    jobTypes: Array<'CDI' | 'CDD' | 'FREELANCE' | 'STAGE' | 'ALTERNANCE'>
    workArrangement: 'remote' | 'hybrid' | 'onsite' | 'flexible'
    availabilityDate?: Date
    willingToRelocate: boolean
  }
  
  // Documents
  documents: {
    resumeUrl?: string
    coverLetterTemplate?: string
    portfolioUrl?: string
    linkedinUrl?: string
    githubUrl?: string
    websiteUrl?: string
  }
  
  // Automation Settings
  automation: {
    autoApplyEnabled: boolean
    maxApplicationsPerDay: number
    customMotivationMessage?: string
    skipCompanies: string[]
    requireKeywords?: string[]
  }
  
  createdAt: Date
  updatedAt: Date
}

export class UserProfileManager {
  // Create or update user profile
  static async saveProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    // In a real implementation, this would save to database
    const now = new Date()
    
    const fullProfile: UserProfile = {
      id: profile.id || `profile_${Date.now()}`,
      userId: profile.userId || 'user_1',
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        city: '',
        country: 'France',
        ...profile.personalInfo
      },
      professional: {
        currentTitle: '',
        experience: '3 ans',
        skills: [],
        languages: [],
        education: [],
        certifications: [],
        ...profile.professional
      },
      preferences: {
        desiredTitles: [],
        preferredLocations: [],
        salaryRange: { currency: 'EUR' },
        jobTypes: ['CDI'],
        workArrangement: 'flexible',
        willingToRelocate: false,
        ...profile.preferences
      },
      documents: {
        ...profile.documents
      },
      automation: {
        autoApplyEnabled: false,
        maxApplicationsPerDay: 10,
        skipCompanies: [],
        ...profile.automation
      },
      createdAt: profile.createdAt || now,
      updatedAt: now
    }
    
    // Save to localStorage for demo purposes
    localStorage.setItem('userProfile', JSON.stringify(fullProfile))
    
    console.log('✅ User profile saved successfully')
    return fullProfile
  }
  
  // Load user profile
  static async loadProfile(userId: string): Promise<UserProfile | null> {
    try {
      const saved = localStorage.getItem('userProfile')
      if (saved) {
        return JSON.parse(saved) as UserProfile
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
    return null
  }
  
  // Generate cover letter data for template engine
  static generateTemplateData(profile: UserProfile): any {
    return {
      name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`.trim() || 'Candidat',
      experience: profile.professional.experience,
      skills: profile.professional.skills,
      currentTitle: profile.professional.currentTitle,
      email: profile.personalInfo.email,
      phone: profile.personalInfo.phone,
      city: profile.personalInfo.address?.city,
      languages: profile.professional.languages.map(l => `${l.language} (${l.level})`).join(', '),
      education: profile.professional.education.map(e => `${e.degree} - ${e.institution}`).join(', ')
    }
  }
  
  // Create default profile template
  static getDefaultProfile(): Partial<UserProfile> {
    return {
      personalInfo: {
        firstName: 'Jean',
        lastName: 'Dupont', 
        email: 'jean.dupont@example.com',
        city: 'Paris',
        country: 'France'
      },
      professional: {
        currentTitle: 'Développeur Full Stack',
        experience: '3 ans',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
        languages: [
          { language: 'Français', level: 'natif' },
          { language: 'Anglais', level: 'avancé' }
        ],
        education: [
          {
            degree: 'Master en Informatique',
            institution: 'Université Paris Diderot',
            year: 2021,
            field: 'Développement logiciel'
          }
        ],
        certifications: []
      },
      preferences: {
        desiredTitles: ['Développeur Full Stack', 'Développeur Frontend', 'Développeur Backend'],
        preferredLocations: ['Paris', 'Remote'],
        salaryRange: {
          min: 45000,
          max: 60000,
          currency: 'EUR'
        },
        jobTypes: ['CDI'],
        workArrangement: 'flexible',
        willingToRelocate: false
      },
      documents: {
        coverLetterTemplate: `Madame, Monsieur,

Je vous écris pour exprimer mon intérêt pour le poste de {{JOB_TITLE}} au sein de {{COMPANY_NAME}}.

Avec {{USER_EXPERIENCE}} d'expérience dans le développement logiciel et une expertise en {{SKILLS}}, je suis convaincu de pouvoir contribuer efficacement à vos projets.

Mes compétences techniques incluent {{SKILLS}} et ma passion pour l'innovation font de moi un candidat idéal pour rejoindre votre équipe.

Je serais ravi de discuter de ma candidature lors d'un entretien.

Cordialement,
{{USER_NAME}}`
      },
      automation: {
        autoApplyEnabled: true,
        maxApplicationsPerDay: 10,
        skipCompanies: [],
        customMotivationMessage: 'Je suis particulièrement motivé par les défis techniques et l\'innovation.'
      }
    }
  }
}