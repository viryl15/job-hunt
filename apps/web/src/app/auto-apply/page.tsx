'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobBoardConfigForm } from '@/components/job-board-config'
import { JobBoardConfig } from '@/lib/database'
import { Plus, Settings, Play, Pause, Eye, Trash2 } from 'lucide-react'

export default function AutoApplyPage() {
  const [configs, setConfigs] = useState<JobBoardConfig[]>([])
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<JobBoardConfig | undefined>()
  const [loading, setLoading] = useState(true)
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set())
  const [useRealAutomation, setUseRealAutomation] = useState(false)

  // Mock user ID - in a real app this would come from authentication
  const userId = 'user_123'

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/job-board-configs?userId=${userId}`)
      const result = await response.json()
      if (result.success) {
        setConfigs(result.data)
      } else {
        console.error('Failed to load configs:', result.error)
      }
    } catch (error) {
      console.error('Failed to load configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (configData: Partial<JobBoardConfig>) => {
    try {
      if (editingConfig) {
        const response = await fetch('/api/job-board-configs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingConfig.id, ...configData })
        })
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error)
        }
      } else {
        const response = await fetch('/api/job-board-configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...configData })
        })
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error)
        }
      }
      
      setShowConfigForm(false)
      setEditingConfig(undefined)
      loadConfigs()
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Failed to save configuration. Please try again.')
    }
  }

  const toggleConfig = async (config: JobBoardConfig) => {
    try {
      const response = await fetch('/api/job-board-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, isActive: !config.isActive })
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }
      loadConfigs()
    } catch (error) {
      console.error('Failed to toggle config:', error)
    }
  }

  const runAutomatedApplication = async (config: JobBoardConfig) => {
    if (runningJobs.has(config.id)) return

    setRunningJobs(prev => new Set(prev).add(config.id))

    try {
      console.log(`Starting automated application for ${config.boardName}...`)
      
      const response = await fetch('/api/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          configId: config.id,
          useRealAutomation: useRealAutomation 
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Automation completed! ${result.message}`)
        console.log('Automation results:', result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Automation failed:', error)
      alert(`Automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(config.id)
        return newSet
      })
    }
  }

  if (showConfigForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {editingConfig ? 'Edit Job Board Configuration' : 'Add Job Board Configuration'}
          </h1>
          <p className="text-muted-foreground">
            Configure automated job applications for job boards like HelloWork
          </p>
        </div>
        
        <JobBoardConfigForm
          config={editingConfig}
          onSave={handleSaveConfig}
          onCancel={() => {
            setShowConfigForm(false)
            setEditingConfig(undefined)
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Automated Job Applications</h1>
          <p className="text-muted-foreground">
            Manage job board configurations and run automated applications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="realAutomation"
              checked={useRealAutomation}
              onChange={(e) => setUseRealAutomation(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="realAutomation" className="text-sm font-medium">
              {useRealAutomation ? (
                <span className="text-red-600">🔴 REAL MODE (Apply to actual jobs!)</span>
              ) : (
                <span className="text-green-600">🟢 DEMO MODE (Safe testing)</span>
              )}
            </label>
          </div>
          <Button onClick={() => setShowConfigForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Job Board
          </Button>
        </div>
      </div>

      {useRealAutomation && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="text-red-600 text-2xl">⚠️</div>
              <div>
                <h3 className="font-bold text-red-800">REAL AUTOMATION MODE ENABLED</h3>
                <p className="text-red-700">
                  This will submit actual job applications to HelloWork using your account. 
                  Make sure your profile, CV, and cover letter template are ready before proceeding.
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Applications cannot be undone. Use demo mode for testing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">Loading configurations...</div>
      ) : configs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No Job Board Configurations</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding a job board configuration to automate your job applications.
            </p>
            <Button onClick={() => setShowConfigForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Job Board
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {configs.map(config => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.boardName}
                      <Badge variant={config.isActive ? 'default' : 'secondary'}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{config.boardUrl}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingConfig(config)
                        setShowConfigForm(true)
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleConfig(config)}
                    >
                      {config.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm">Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.preferences.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {config.preferences.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{config.preferences.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm">Salary Range</h4>
                    <p className="text-sm text-muted-foreground">
                      €{config.preferences.salaryMin?.toLocaleString()} - €{config.preferences.salaryMax?.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm">Daily Limit</h4>
                    <p className="text-sm text-muted-foreground">
                      {config.applicationSettings.maxApplicationsPerDay} applications/day
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => alert('Application logs feature coming soon!')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Logs
                  </Button>
                  <Button
                    size="sm"
                    disabled={!config.isActive || runningJobs.has(config.id)}
                    onClick={() => runAutomatedApplication(config)}
                  >
                    {runningJobs.has(config.id) ? (
                      'Running...'
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Automation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}