'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Toast } from '@/components/ui/toast'

interface UserProfile {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    city: string
    country: string
  }
  professional: {
    currentTitle: string
    experience: string
    skills: string[]
    languages: Array<{
      language: string
      level: string
    }>
  }
  preferences: {
    preferredLocations: string[]
    salaryRange: {
      min?: number
      max?: number
      currency: string
    }
    jobTypes: string[]
    workArrangement: string
  }
  documents: {
    coverLetterTemplate?: string
    resumeUrl?: string
    portfolioUrl?: string
  }
  automation: {
    maxApplicationsPerDay: number
    skipCompanies: string[]
    customMotivationMessage?: string
  }
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      country: 'France'
    },
    professional: {
      currentTitle: '',
      experience: '3 ans',
      skills: [],
      languages: [
        { language: 'Français', level: 'natif' },
        { language: 'Anglais', level: 'avancé' }
      ]
    },
    preferences: {
      preferredLocations: [],
      salaryRange: { currency: 'EUR' },
      jobTypes: ['CDI'],
      workArrangement: 'flexible'
    },
    documents: {
      coverLetterTemplate: '',
      resumeUrl: '',
      portfolioUrl: ''
    },
    automation: {
      maxApplicationsPerDay: 10,
      skipCompanies: [],
      customMotivationMessage: ''
    }
  })

  const [newSkill, setNewSkill] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newSkipCompany, setNewSkipCompany] = useState('')
  const [previewCoverLetter, setPreviewCoverLetter] = useState('')
  const [saving, setSaving] = useState(false)

  // Load profile on component mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile?configId=config_1')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          setProfile(data.profile)
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: 'config_1',
          ...profile
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('✅ Profil sauvegardé avec succès!')
        generatePreview()
      } else {
        alert('❌ Erreur lors de la sauvegarde: ' + result.error)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const generatePreview = () => {
    if (!profile.documents.coverLetterTemplate) return

    let preview = profile.documents.coverLetterTemplate
    const sampleJob = {
      title: 'Développeur Full Stack',
      company: 'TechStart Innovation'
    }

    const replacements = {
      '{{USER_NAME}}': `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`.trim(),
      '{{USER_EXPERIENCE}}': profile.professional.experience,
      '{{SKILLS}}': profile.professional.skills.slice(0, 4).join(', '),
      '{{JOB_TITLE}}': sampleJob.title,
      '{{COMPANY_NAME}}': sampleJob.company,
      '{{DATE}}': new Date().toLocaleDateString('fr-FR')
    }

    Object.entries(replacements).forEach(([placeholder, value]) => {
      preview = preview.replace(new RegExp(placeholder, 'g'), value)
    })

    setPreviewCoverLetter(preview)
  }

  const addSkill = () => {
    if (newSkill && !profile.professional.skills.includes(newSkill)) {
      setProfile(prev => ({
        ...prev,
        professional: {
          ...prev.professional,
          skills: [...prev.professional.skills, newSkill]
        }
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: prev.professional.skills.filter(s => s !== skill)
      }
    }))
  }

  const addLocation = () => {
    if (newLocation && !profile.preferences.preferredLocations.includes(newLocation)) {
      setProfile(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          preferredLocations: [...prev.preferences.preferredLocations, newLocation]
        }
      }))
      setNewLocation('')
    }
  }

  const removeLocation = (location: string) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        preferredLocations: prev.preferences.preferredLocations.filter(l => l !== location)
      }
    }))
  }

  const addSkipCompany = () => {
    if (newSkipCompany && !profile.automation.skipCompanies.includes(newSkipCompany)) {
      setProfile(prev => ({
        ...prev,
        automation: {
          ...prev.automation,
          skipCompanies: [...prev.automation.skipCompanies, newSkipCompany]
        }
      }))
      setNewSkipCompany('')
    }
  }

  const removeSkipCompany = (company: string) => {
    setProfile(prev => ({
      ...prev,
      automation: {
        ...prev.automation,
        skipCompanies: prev.automation.skipCompanies.filter(c => c !== company)
      }
    }))
  }

  const setDefaultTemplate = () => {
    const defaultTemplate = `Madame, Monsieur,

Je vous écris pour exprimer mon intérêt pour le poste de {{JOB_TITLE}} au sein de {{COMPANY_NAME}}.

Avec {{USER_EXPERIENCE}} d'expérience dans le développement logiciel et une expertise en {{SKILLS}}, je suis convaincu de pouvoir contribuer efficacement à vos projets.

Mes compétences techniques et ma passion pour l'innovation font de moi un candidat idéal pour rejoindre votre équipe.

Je serais ravi de discuter de ma candidature lors d'un entretien.

Cordialement,
{{USER_NAME}}`

    setProfile(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        coverLetterTemplate: defaultTemplate
      }
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">⚙️ Paramètres du Profil</h1>
        <p className="text-muted-foreground mt-2">
          Configurez vos informations personnelles et professionnelles pour personnaliser vos candidatures automatiques.
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">👤 Personnel</TabsTrigger>
          <TabsTrigger value="professional">💼 Professionnel</TabsTrigger>
          <TabsTrigger value="preferences">🎯 Préférences</TabsTrigger>
          <TabsTrigger value="documents">📄 Documents</TabsTrigger>
          <TabsTrigger value="automation">🤖 Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
              <CardDescription>
                Ces informations seront utilisées dans vos candidatures et lettres de motivation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profile.personalInfo.firstName}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                    }))}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profile.personalInfo.lastName}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                    }))}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.personalInfo.email}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, email: e.target.value }
                  }))}
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input
                    id="phone"
                    value={profile.personalInfo.phone}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, phone: e.target.value }
                    }))}
                    placeholder="+33 6 XX XX XX XX"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={profile.personalInfo.city}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, city: e.target.value }
                    }))}
                    placeholder="Paris"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expérience Professionnelle</CardTitle>
              <CardDescription>
                Décrivez votre expérience et vos compétences techniques.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentTitle">Titre Actuel / Désiré</Label>
                <Input
                  id="currentTitle"
                  value={profile.professional.currentTitle}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    professional: { ...prev.professional, currentTitle: e.target.value }
                  }))}
                  placeholder="Développeur Full Stack"
                />
              </div>

              <div>
                <Label htmlFor="experience">Expérience</Label>
                <Input
                  id="experience"
                  value={profile.professional.experience}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    professional: { ...prev.professional, experience: e.target.value }
                  }))}
                  placeholder="5 ans"
                />
              </div>

              <div>
                <Label>Compétences Techniques</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Ajouter une compétence"
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill} variant="outline">Ajouter</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.professional.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                      {skill} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Recherche</CardTitle>
              <CardDescription>
                Définissez vos critères de recherche d'emploi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Lieux de Travail Préférés</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Paris, Remote, etc."
                    onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                  />
                  <Button onClick={addLocation} variant="outline">Ajouter</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.preferredLocations.map((location, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeLocation(location)}>
                      {location} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Salaire Min (€)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={profile.preferences.salaryRange.min || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        salaryRange: { ...prev.preferences.salaryRange, min: Number(e.target.value) }
                      }
                    }))}
                    placeholder="45000"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Salaire Max (€)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={profile.preferences.salaryRange.max || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        salaryRange: { ...prev.preferences.salaryRange, max: Number(e.target.value) }
                      }
                    }))}
                    placeholder="65000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lettre de Motivation Template</CardTitle>
              <CardDescription>
                Personnalisez votre modèle de lettre de motivation. Utilisez les variables: {`{{USER_NAME}}, {{USER_EXPERIENCE}}, {{SKILLS}}, {{JOB_TITLE}}, {{COMPANY_NAME}}, {{LOCATION}}, {{DATE}}`}
                <br />
                <span className="text-xs text-muted-foreground">Note: Le modèle par défaut n&apos;inclut pas la localisation, mais vous pouvez l&apos;ajouter avec {`{{LOCATION}}`}.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button onClick={setDefaultTemplate} variant="outline">
                  📝 Utiliser le Modèle par Défaut
                </Button>
                <Button onClick={generatePreview} variant="outline">
                  👀 Aperçu
                </Button>
              </div>

              <Textarea
                value={profile.documents.coverLetterTemplate}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  documents: { ...prev.documents, coverLetterTemplate: e.target.value }
                }))}
                placeholder="Votre modèle de lettre de motivation..."
                rows={10}
                className="font-mono text-sm"
              />

              {previewCoverLetter && (
                <div>
                  <Separator className="my-4" />
                  <Label className="text-sm font-semibold">Aperçu avec vos données:</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-line text-sm">
                    {previewCoverLetter}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'Automatisation</CardTitle>
              <CardDescription>
                Configurez les paramètres de candidature automatique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxApps">Nombre maximum de candidatures par jour</Label>
                <Input
                  id="maxApps"
                  type="number"
                  value={profile.automation.maxApplicationsPerDay}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    automation: { ...prev.automation, maxApplicationsPerDay: Number(e.target.value) }
                  }))}
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <Label>Entreprises à Éviter</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSkipCompany}
                    onChange={(e) => setNewSkipCompany(e.target.value)}
                    placeholder="Nom de l'entreprise à éviter"
                    onKeyPress={(e) => e.key === 'Enter' && addSkipCompany()}
                  />
                  <Button onClick={addSkipCompany} variant="outline">Ajouter</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.automation.skipCompanies.map((company, index) => (
                    <Badge key={index} variant="destructive" className="cursor-pointer" onClick={() => removeSkipCompany(company)}>
                      {company} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="customMessage">Message de Motivation Personnalisé</Label>
                <Textarea
                  id="customMessage"
                  value={profile.automation.customMotivationMessage}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    automation: { ...prev.automation, customMotivationMessage: e.target.value }
                  }))}
                  placeholder="Un message personnel qui sera ajouté à vos candidatures..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6">
        <Button variant="outline" onClick={generatePreview}>
          👀 Aperçu de la Lettre
        </Button>
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder le Profil'}
        </Button>
      </div>
    </div>
  )
}