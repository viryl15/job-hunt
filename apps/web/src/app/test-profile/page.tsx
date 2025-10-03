"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfileTest() {
  const [status, setStatus] = useState<string>('Testing profile functionality...')
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testProfile = async () => {
    try {
      setStatus('Testing profile API...')
      
      // Test GET request
      const response = await fetch('/api/profile?configId=config_1')
      const data = await response.json()
      
      if (data.success) {
        setStatus('✅ Profile loaded successfully!')
        setProfileData(data.profile)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to load profile')
      }
      
    } catch (err) {
      setError((err as Error).message)
      setStatus('❌ Profile test failed')
    }
  }

  const testProfileUpdate = async () => {
    try {
      setStatus('Testing profile update...')
      
      const testUpdate = {
        configId: 'config_1',
        personalInfo: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com',
          phone: '+33 1 23 45 67 89'
        },
        professional: {
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
          experience: '5 ans'
        },
        preferences: {
          preferredLocations: ['Paris', 'Lyon', 'Remote'],
          salaryRange: { min: 50000, max: 70000 },
          jobTypes: ['CDI', 'Freelance']
        }
      }
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUpdate)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStatus('✅ Profile updated successfully!')
        setError(null)
        // Reload profile to see changes
        testProfile()
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
      
    } catch (err) {
      setError((err as Error).message)
      setStatus('❌ Profile update failed')
    }
  }

  useEffect(() => {
    testProfile()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile System Test</CardTitle>
            <CardDescription>Testing the profile management functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Status</h3>
              <p>{status}</p>
              {error && (
                <p className="text-red-600 mt-2">Error: {error}</p>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button onClick={testProfile} variant="outline">
                Test Profile Load
              </Button>
              <Button onClick={testProfileUpdate}>
                Test Profile Update
              </Button>
            </div>
            
            {profileData && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-2">Loaded Profile Data</h3>
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(profileData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}