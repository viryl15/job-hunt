# 👤 How to Update Your User Profile

Your user profile controls how the automation system generates personalized cover letters and applications. Here are the different ways to update it:

## 🚀 Method 1: Quick Profile Setup (Recommended)

1. **Edit the setup script**: Open `setup-my-profile.js`
2. **Customize your information**: Update the `myProfile` object with your details:

```javascript
const myProfile = {
  personalInfo: {
    firstName: 'Your Name',        // 👈 Change this
    lastName: 'Your Last Name',   // 👈 Change this
    email: 'your.email@example.com', // 👈 Change this
    phone: '+33 6 XX XX XX XX',   // 👈 Your phone
    city: 'Your City',            // 👈 Your city
    country: 'France'
  },
  
  professional: {
    currentTitle: 'Your Job Title',     // 👈 Current or desired title
    experience: 'X ans',                // 👈 "2 ans", "5 ans", etc.
    skills: [                           // 👈 Add your skills
      'JavaScript',
      'React', 
      'Python',
      // Add more...
    ]
    // ... more fields
  }
  // ... rest of profile
}
```

3. **Run the script**: `node setup-my-profile.js`
4. **Review the output**: Check the generated cover letter and profile data

## 🔧 Method 2: Direct Configuration Update

Update your existing JobBoardConfig with profile data:

```javascript
// In your test or API route
const config = {
  credentials: {
    username: 'Jean Dupont',              // 👈 Your full name
    email: 'jean.dupont@example.com',     // 👈 Your email
    password: 'your_password'
  },
  preferences: {
    skills: ['JavaScript', 'React', 'Node.js'], // 👈 Your skills
    experienceLevel: '3 ans',             // 👈 Your experience
    locations: ['Paris', 'Lyon'],        // 👈 Where you want to work
    jobTypes: ['CDI', 'FREELANCE'],      // 👈 Job types you want
    salaryMin: 45000,                     // 👈 Minimum salary
    salaryMax: 65000,                     // 👈 Maximum salary
    remotePreference: 'flexible'          // 👈 remote/hybrid/onsite/flexible
  },
  applicationSettings: {
    coverLetterTemplate: `Your custom template...`, // 👈 Custom cover letter
    maxApplicationsPerDay: 15,            // 👈 Daily application limit
    customMessage: 'Your motivation'      // 👈 Personal message
  }
}
```

## 📊 Method 3: Using the Profile API

Send a POST request to update your profile:

```javascript
// Update profile via API
fetch('/api/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    configId: 'your-config-id',
    personalInfo: {
      firstName: 'Your Name',
      lastName: 'Your Last Name',
      email: 'your.email@example.com'
    },
    professional: {
      skills: ['JavaScript', 'React', 'Python'],
      experience: '5 ans',
      currentTitle: 'Senior Developer'
    },
    preferences: {
      preferredLocations: ['Paris', 'Remote'],
      salaryRange: { min: 50000, max: 70000 }
    }
  })
})
```

## 🎯 Key Profile Fields That Affect Applications

### Personal Information
- **firstName/lastName**: Used in `{{USER_NAME}}` template variable
- **email**: Used for login and contact information
- **city**: Optional location information

### Professional Details
- **skills**: Used in `{{SKILLS}}` template variable (first 4-5 skills shown)
- **experience**: Used in `{{USER_EXPERIENCE}}` template variable
- **currentTitle**: Your job title for professional context

### Job Preferences
- **preferredLocations**: Where you want to work
- **salaryRange**: Your salary expectations
- **jobTypes**: CDI, CDD, FREELANCE, etc.
- **workArrangement**: remote/hybrid/onsite/flexible

### Cover Letter Template
- **coverLetterTemplate**: Your personalized template with variables:
  - `{{USER_NAME}}` - Your full name
  - `{{USER_EXPERIENCE}}` - Your experience level
  - `{{SKILLS}}` - Your top skills (comma-separated)
  - `{{JOB_TITLE}}` - Applied job title
  - `{{COMPANY_NAME}}` - Target company name
  - `{{DATE}}` - Current date

## 📝 Cover Letter Template Variables

When creating your cover letter template, you can use these variables:

```
{{USER_NAME}}        → Jean Dupont
{{USER_EXPERIENCE}}  → 3 ans  
{{SKILLS}}           → JavaScript, React, Python, Node.js
{{JOB_TITLE}}        → Développeur Full Stack
{{COMPANY_NAME}}     → TechStart Innovation
{{DATE}}             → 03/10/2025
```

## ✨ Example Complete Profile Update

Here's a complete example of updating your profile:

```javascript
// 1. Edit setup-my-profile.js with your information
const myProfile = {
  personalInfo: {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@email.com',
    phone: '+33 6 12 34 56 78',
    city: 'Lyon'
  },
  professional: {
    currentTitle: 'Développeuse Frontend',
    experience: '4 ans',
    skills: ['React', 'Vue.js', 'TypeScript', 'CSS', 'Figma', 'Node.js'],
    languages: [
      { language: 'Français', level: 'natif' },
      { language: 'Anglais', level: 'avancé' },
      { language: 'Allemand', level: 'intermédiaire' }
    ]
  },
  preferences: {
    desiredTitles: ['Développeuse Frontend', 'Lead Frontend', 'Full Stack'],
    preferredLocations: ['Lyon', 'Remote', 'Paris'],
    salaryRange: { min: 48000, max: 62000, currency: 'EUR' },
    jobTypes: ['CDI'],
    workArrangement: 'flexible'
  },
  documents: {
    coverLetterTemplate: `Madame, Monsieur,

Je vous écris pour exprimer mon vif intérêt pour le poste de {{JOB_TITLE}} au sein de {{COMPANY_NAME}}.

Forte de {{USER_EXPERIENCE}} d'expérience dans le développement frontend et d'une expertise approfondie en {{SKILLS}}, je suis convaincue de pouvoir apporter une réelle valeur ajoutée à vos projets.

Ma passion pour les interfaces utilisateur modernes et mon attention particulière à l'expérience utilisateur font de moi une candidate idéale pour rejoindre votre équipe.

Je serais ravie de discuter de ma candidature et de mes motivations lors d'un entretien.

Cordialement,
{{USER_NAME}}`
  },
  automation: {
    autoApplyEnabled: true,
    maxApplicationsPerDay: 12,
    skipCompanies: ['Previous Bad Company'],
    customMotivationMessage: 'Je suis particulièrement motivée par les défis UX/UI et les technologies innovantes.'
  }
}

// 2. Run: node setup-my-profile.js
// 3. The automation will now use your personalized data!
```

## 🔄 Testing Your Profile

After updating your profile:

1. **Run the setup script** to see the generated cover letter
2. **Test with the cover letter engine**: `node test-cover-letter-engine.js`
3. **Run a test automation** to see your profile in action
4. **Check the generated applications** for personalized content

## 📞 Need Help?

If you need to adjust specific fields or have questions about the profile structure, just let me know what you want to change and I can help you update it!