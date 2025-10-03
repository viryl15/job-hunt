'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ProfileSummary {
  name: string
  title: string
  experience: string
  skills: string[]
  locations: string[]
  applicationsToday: number
  maxApplications: number
}

export default function ProfileSummaryCard() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfileSummary()
  }, [])

  const loadProfileSummary = async () => {
    try {
      const response = await fetch('/api/profile?configId=config_1')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          const p = data.profile
          setProfile({
            name: `${p.personalInfo.firstName} ${p.personalInfo.lastName}`.trim() || 'Utilisateur',
            title: p.professional.currentTitle || 'Développeur',
            experience: p.professional.experience || '3 ans',
            skills: p.professional.skills?.slice(0, 4) || [],
            locations: p.preferences.preferredLocations?.slice(0, 3) || [],
            applicationsToday: 0, // This would come from application tracking
            maxApplications: p.automation.maxApplicationsPerDay || 10
          })
        }
      }
    } catch (error) {
      console.error('Failed to load profile summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-muted rounded w-16"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👤 Profil Utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Votre profil n'est pas encore configuré.
          </p>
          <Link 
            href="/profile" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            ⚙️ Configurer mon Profil
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          👤 {profile.name}
          <Link 
            href="/profile" 
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ⚙️ Modifier
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Titre</p>
          <p className="font-medium">{profile.title}</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Expérience</p>
          <p className="font-medium">{profile.experience}</p>
        </div>

        {profile.skills.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Compétences</p>
            <div className="flex flex-wrap gap-1">
              {profile.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {profile.skills.length < 4 && (
                <Link href="/profile">
                  <Badge variant="outline" className="text-xs cursor-pointer">
                    + Ajouter
                  </Badge>
                </Link>
              )}
            </div>
          </div>
        )}

        {profile.locations.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Lieux préférés</p>
            <div className="flex flex-wrap gap-1">
              {profile.locations.map((location, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  📍 {location}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Candidatures aujourd'hui</span>
            <span className="font-medium">
              {profile.applicationsToday} / {profile.maxApplications}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-1">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ 
                width: `${Math.min((profile.applicationsToday / profile.maxApplications) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}