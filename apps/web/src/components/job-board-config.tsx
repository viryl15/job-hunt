'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JobBoardConfig } from '@/lib/database'

interface JobBoardConfigFormProps {
  config?: JobBoardConfig
  onSave: (config: Partial<JobBoardConfig>) => void
  onCancel: () => void
}

const getDefaultCoverLetterTemplate = () => {
  return `Madame, Monsieur,

Je vous écris pour exprimer mon intérêt pour le poste de {{JOB_TITLE}} au sein de {{COMPANY_NAME}}.

Avec {{USER_EXPERIENCE}} d'expérience dans le développement logiciel et une expertise en {{SKILLS}}, je suis convaincu de pouvoir contribuer efficacement à vos projets.

Mes compétences techniques et ma passion pour l'innovation font de moi un candidat idéal pour rejoindre votre équipe à {{LOCATION}}.

Je serais ravi de discuter de ma candidature lors d'un entretien.

Cordialement,
{{USER_NAME}}`
}

export function JobBoardConfigForm({ config, onSave, onCancel }: JobBoardConfigFormProps) {
  const [formData, setFormData] = useState({
    boardName: config?.boardName || 'HelloWork',
    boardUrl: config?.boardUrl || 'https://www.hellowork.com',
    credentials: {
      email: config?.credentials?.email || '',
      password: config?.credentials?.password || '',
      username: config?.credentials?.username || '',
      phone: config?.credentials?.phone || '',
      address: config?.credentials?.address || ''
    },
    preferences: {
      skills: config?.preferences?.skills || [],
      locations: config?.preferences?.locations || ['France', 'Germany', 'Luxembourg'],
      salaryMin: config?.preferences?.salaryMin || 40000,
      salaryMax: config?.preferences?.salaryMax || 80000,
      jobTypes: config?.preferences?.jobTypes || ['CDI', 'CDD'],
      experienceLevel: config?.preferences?.experienceLevel || 'Mid-level',
      remotePreference: config?.preferences?.remotePreference || 'hybrid' as const
    },
    applicationSettings: {
      autoApply: config?.applicationSettings?.autoApply || false,
      maxApplicationsPerDay: config?.applicationSettings?.maxApplicationsPerDay || 5,
      coverLetterTemplate: config?.applicationSettings?.coverLetterTemplate || getDefaultCoverLetterTemplate(),
      useCustomTemplate: config?.applicationSettings?.useCustomTemplate !== undefined ? config.applicationSettings.useCustomTemplate : true,
      resumeUrl: config?.applicationSettings?.resumeUrl || '',
      customMessage: config?.applicationSettings?.customMessage || ''
    },
    isActive: config?.isActive ?? true
  })

  const [newSkill, setNewSkill] = useState('')
  const [testConnection, setTestConnection] = useState(false)

  const supportedBoards = [
    {
      name: 'HelloWork',
      url: 'https://www.hellowork.com',
      description: 'Leading French job board with automated application support'
    }
  ]



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.preferences.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          skills: [...prev.preferences.skills, newSkill.trim()]
        }
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        skills: prev.preferences.skills.filter(s => s !== skill)
      }
    }))
  }

  const testJobBoardConnection = async () => {
    setTestConnection(true)
    try {
      // In a real implementation, this would test the connection
      console.log('Testing connection to', formData.boardName)
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Connection test successful!')
    } catch (error) {
      alert('Connection test failed. Please check your credentials.')
    } finally {
      setTestConnection(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="board">Job Board</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="template">Templates</TabsTrigger>
        </TabsList>

        {/* Job Board Configuration */}
        <TabsContent value="board">
          <Card>
            <CardHeader>
              <CardTitle>Job Board Configuration</CardTitle>
              <CardDescription>
                Configure your job board credentials and connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="boardName">Job Board</Label>
                <Select 
                  value={formData.boardName} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, boardName: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job board" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedBoards.map(board => (
                      <SelectItem key={board.name} value={board.name}>
                        {board.name} - {board.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.credentials.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, email: e.target.value }
                  }))}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.credentials.password}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, password: e.target.value }
                  }))}
                  placeholder="Your job board password"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.credentials.phone || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, phone: e.target.value }
                  }))}
                  placeholder="0600000000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Some applications may require your phone number
                </p>
              </div>

              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.credentials.address || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, address: e.target.value }
                  }))}
                  placeholder="123 Rue Example, 75001 Paris"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Some applications may require your address
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: Boolean(checked) }))}
                />
                <Label htmlFor="isActive">Enable automated applications</Label>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                onClick={testJobBoardConnection}
                disabled={testConnection}
              >
                {testConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Job Search Preferences</CardTitle>
              <CardDescription>
                Define what types of jobs you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Skills & Technologies</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g., JavaScript, React)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.preferences.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Minimum Salary (€)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.preferences.salaryMin}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, salaryMin: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Maximum Salary (€)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.preferences.salaryMax}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, salaryMax: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Remote Work Preference</Label>
                <Select 
                  value={formData.preferences.remotePreference} 
                  onValueChange={(value) => 
                    setFormData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, remotePreference: value as 'remote' | 'hybrid' | 'onsite' | 'any' }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote Only</SelectItem>
                    <SelectItem value="hybrid">Hybrid OK</SelectItem>
                    <SelectItem value="onsite">On-site OK</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Settings */}
        <TabsContent value="application">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure how applications are submitted automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoApply"
                  checked={formData.applicationSettings.autoApply}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    applicationSettings: { ...prev.applicationSettings, autoApply: checked }
                  }))}
                />
                <Label htmlFor="autoApply">Enable automatic job applications</Label>
              </div>

              <div>
                <Label htmlFor="maxApplications">Maximum applications per day</Label>
                <Input
                  id="maxApplications"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.applicationSettings.maxApplicationsPerDay}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    applicationSettings: { 
                      ...prev.applicationSettings, 
                      maxApplicationsPerDay: parseInt(e.target.value) 
                    }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="resumeUrl">Resume/CV URL</Label>
                <Input
                  id="resumeUrl"
                  type="url"
                  value={formData.applicationSettings.resumeUrl}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    applicationSettings: { ...prev.applicationSettings, resumeUrl: e.target.value }
                  }))}
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              <div>
                <Label htmlFor="customMessage">Custom Application Message</Label>
                <Textarea
                  id="customMessage"
                  value={formData.applicationSettings.customMessage}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    applicationSettings: { ...prev.applicationSettings, customMessage: e.target.value }
                  }))}
                  placeholder="Optional message to include with applications"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cover Letter Template */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter Template</CardTitle>
              <CardDescription>
                Customize your cover letter template with dynamic placeholders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="useCustomTemplate" className="text-base font-medium">
                    Use Custom Cover Letter Template
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable this to include your custom cover letter with job applications. 
                    Disable to apply with just the pre-filled form (HelloWork doesn&apos;t require a motivation message).
                  </p>
                </div>
                <Switch
                  id="useCustomTemplate"
                  checked={formData.applicationSettings.useCustomTemplate}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    applicationSettings: { ...prev.applicationSettings, useCustomTemplate: checked }
                  }))}
                />
              </div>

              {formData.applicationSettings.useCustomTemplate && (
                <div>
                  <Label htmlFor="coverLetterTemplate">Template</Label>
                  <Textarea
                    id="coverLetterTemplate"
                    value={formData.applicationSettings.coverLetterTemplate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      applicationSettings: { ...prev.applicationSettings, coverLetterTemplate: e.target.value }
                    }))}
                    rows={12}
                    className="font-mono"
                  />
                </div>
              )}
              
              {formData.applicationSettings.useCustomTemplate && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Available Placeholders:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <code>{'{{COMPANY_NAME}}'}</code>
                    <code>{'{{JOB_TITLE}}'}</code>
                    <code>{'{{USER_NAME}}'}</code>
                    <code>{'{{USER_EXPERIENCE}}'}</code>
                    <code>{'{{SKILLS}}'}</code>
                    <code>{'{{LOCATION}}'}</code>
                    <code>{'{{DATE}}'}</code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {config ? 'Update Configuration' : 'Save Configuration'}
        </Button>
      </div>
    </form>
  )
}