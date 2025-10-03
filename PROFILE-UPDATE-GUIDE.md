# 👤 User Profile Management Guide

## 🎯 Where to Update Your Profile

You now have **multiple ways** to manage your user profile for job automation:

## 🌐 **Option 1: Web Interface (Recommended)**

### **📱 Profile Settings Page**
- **URL**: `http://localhost:3000/profile`
- **Features**: 
  - ✅ User-friendly web interface
  - ✅ Real-time preview of cover letters
  - ✅ Easy skill/location management
  - ✅ Template customization
  - ✅ Instant save and validation

### **🏠 Dashboard Profile Card**
- **URL**: `http://localhost:3000/` (main dashboard)
- **Features**:
  - ✅ Quick profile summary
  - ✅ Daily application progress
  - ✅ One-click edit access

## 💻 **Option 2: Script-Based Setup**

### **🚀 Interactive Profile Setup**
```bash
# Run the profile setup script
node setup-my-profile.js

# Follow the prompts and customize your profile
# Generates: my-job-profile.json
```

### **🧪 Test Your Profile**
```bash
# Test the cover letter generation
node test-cover-letter-engine.js

# Verify template variables are replaced correctly
```

## 🔧 **Option 3: API Direct**

### **📡 Profile API Endpoint**
```javascript
// Update profile via REST API
POST /api/profile
{
  "configId": "config_1",
  "personalInfo": { "firstName": "Jean", "lastName": "Dupont" },
  "professional": { "skills": ["React", "Node.js"], "experience": "5 ans" },
  "preferences": { "preferredLocations": ["Paris", "Remote"] }
}

// Get current profile
GET /api/profile?configId=config_1
```

## 📊 **Profile Structure Overview**

Your profile includes these key sections:

### **👤 Personal Information**
- Name, email, phone, location
- Used in: Cover letter signatures, contact forms

### **💼 Professional Details** 
- Current title, experience, skills, languages
- Used in: Template variables, job matching

### **🎯 Job Preferences**
- Desired locations, salary range, job types
- Used in: Job search filtering, application targeting

### **📄 Documents & Templates**
- Custom cover letter templates with variables
- Used in: Automated application generation

### **🤖 Automation Settings**
- Daily application limits, company blacklist
- Used in: Automation behavior control

## 🌟 **Quick Start Guide**

### **For First-Time Users:**
1. **Go to Profile Page**: Visit `http://localhost:3000/profile`
2. **Fill Personal Info**: Add your name, email, and contact details
3. **Add Skills**: List your technical competencies
4. **Set Preferences**: Choose locations and salary expectations
5. **Customize Template**: Edit your cover letter template
6. **Save Profile**: Click save and test with preview

### **For Existing Users:**
1. **Check Dashboard**: View your profile summary on the homepage
2. **Quick Edits**: Click "Modifier" for fast updates
3. **Full Settings**: Use the profile page for comprehensive changes

## 🔄 **Profile Updates in Action**

Once you update your profile:

### **✅ Immediate Effects:**
- Cover letters use your real name and experience
- Skills are properly listed (no more template variables)
- Location references are removed (as requested)
- Custom motivation messages are included

### **📈 Enhanced Automation:**
- Jobs match your preferences better
- Applications are more personalized
- Success rates improve with targeted content

## 🛠️ **Troubleshooting**

### **Profile Not Loading?**
```bash
# Check if API endpoint exists
curl http://localhost:3000/api/profile?configId=config_1
```

### **Template Variables Still Showing?**
- Ensure profile is saved correctly
- Verify template uses correct variable names
- Check automation code uses ApplicationTemplateEngine

### **Missing UI Components?**
- Run: `npm install` in the apps/web directory
- Check if all UI components are properly installed

## 🎨 **Interface Screenshots**

### **Profile Settings Page Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Paramètres du Profil                                      │
├─────────────────────────────────────────────────────────────┤
│ [👤 Personnel] [💼 Professionnel] [🎯 Préférences] [📄 Documents] [🤖 Automation] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤 Informations Personnelles                               │
│ ┌─────────────────┐ ┌─────────────────┐                   │
│ │ Prénom: Jean    │ │ Nom: Dupont     │                   │
│ └─────────────────┘ └─────────────────┘                   │
│ ┌─────────────────────────────────────────┐                │
│ │ Email: jean.dupont@example.com          │                │
│ └─────────────────────────────────────────┘                │
│                                                             │
│ 💼 Compétences: [React] [Node.js] [+Ajouter]              │
│ 🎯 Lieux: [Paris] [Remote] [+Ajouter]                     │
│                                                             │
│ [👀 Aperçu de la Lettre] [💾 Sauvegarder le Profil]       │
└─────────────────────────────────────────────────────────────┘
```

### **Dashboard Profile Card:**
```
┌─────────────────────────────────────┐
│ 👤 Jean Dupont              ⚙️ Modifier │
├─────────────────────────────────────┤
│ Titre: Développeur Full Stack        │
│ Expérience: 5 ans                   │
│                                     │
│ Compétences: [React] [Node.js] [JS] │
│ Lieux: [📍 Paris] [📍 Remote]       │
│                                     │
│ Candidatures: 3/15 ████░░░░░        │
└─────────────────────────────────────┘
```

## 📝 **Next Steps**

1. **Visit the Profile Page**: `http://localhost:3000/profile`
2. **Fill in your information** using the user-friendly interface
3. **Preview your cover letter** to see personalized content
4. **Save and test** with the automation system
5. **Monitor results** on the dashboard

Your profile system is now fully integrated and ready to use! 🚀