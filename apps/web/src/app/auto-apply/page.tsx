'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobBoardConfigForm } from '@/components/job-board-config'
import { JobBoardConfig } from '@/lib/database'
import { Plus, Settings, Play, Pause, Eye, Trash2, Loader2, X } from 'lucide-react'
import { useAutomationStore } from '@/store/automation-store'

export default function AutoApplyPage() {
  const { data: session, status } = useSession()
  const [configs, setConfigs] = useState<JobBoardConfig[]>([])
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<JobBoardConfig | undefined>()
  const [loading, setLoading] = useState(true)
  const [useRealAutomation, setUseRealAutomation] = useState(false)
  
  // Use Zustand store for automation state
  const { 
    automations, 
    startAutomation, 
    updateAutomation,
    completeAutomation,
    failAutomation,
    removeAutomation,
    isRunning,
    getAllAutomations,
    getRunningCount
  } = useAutomationStore()

  // Get user ID from authenticated session
  const userId = session?.user?.id

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      loadConfigs()
    }
  }, [status, userId])
  
  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      })
    }
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
    if (isRunning(config.id)) {
      alert('This automation is already running!')
      return
    }

    // Start automation in store (initialize UI state)
    startAutomation(config.id, config.boardName)

    try {
      console.log(`Starting automated application for ${config.boardName}...`)
      
      // Connect to SSE endpoint for real-time progress updates
      const response = await fetch('/api/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          configId: config.id,
          useRealAutomation: useRealAutomation 
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true })
        
        // Split by lines (SSE format)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              
              if (data.type === 'progress') {
                // Update Zustand store with real-time progress
                updateAutomation(config.id, data.data)
              } else if (data.type === 'complete') {
                // Mark as completed
                completeAutomation(config.id)
                console.log('Automation completed:', data.data)
              } else if (data.type === 'error') {
                // Mark as failed
                failAutomation(config.id, data.error)
                console.error('Automation failed:', data.error)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Automation failed:', error)
      failAutomation(config.id, error instanceof Error ? error.message : 'Unknown error')
      alert(`❌ Automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show message if not authenticated
  if (status === 'unauthenticated' || !userId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to access job automation features.
          </p>
          <Button onClick={() => window.location.href = '/api/auth/signin'}>
            Sign In
          </Button>
        </div>
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

      {/* Multiple Automation Progress Indicators */}
      {getAllAutomations().length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Running Automations ({getRunningCount()})
            </h3>
            {getAllAutomations().some(a => a.status === 'completed' || a.status === 'failed') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  getAllAutomations().forEach(a => {
                    if (a.status === 'completed' || a.status === 'failed') {
                      removeAutomation(a.configId)
                    }
                  })
                }}
              >
                Clear Completed
              </Button>
            )}
          </div>

          {getAllAutomations().map((automation) => (
            <Card 
              key={automation.configId} 
              className={`${
                automation.status === 'completed' ? 'border-green-200 bg-green-50' :
                automation.status === 'failed' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Loader2 className={`h-6 w-6 ${
                        automation.status === 'completed' || automation.status === 'failed' ? '' : 'animate-spin'
                      } ${
                        automation.status === 'completed' ? 'text-green-600' : 
                        automation.status === 'failed' ? 'text-red-600' : 
                        'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">
                            {automation.configName}
                          </h4>
                          <Badge variant={
                            automation.status === 'completed' ? 'default' : 
                            automation.status === 'failed' ? 'destructive' : 
                            'secondary'
                          }>
                            {automation.status === 'completed' ? '✅ Completed' :
                             automation.status === 'failed' ? '❌ Failed' :
                             automation.status === 'running' ? '🔄 Running' :
                             '⏳ Starting'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{automation.currentJobTitle}</p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold">
                        {automation.totalJobs > 0 ? Math.round((automation.currentJob / automation.totalJobs) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">
                        {automation.currentJob} / {automation.totalJobs} jobs
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        automation.status === 'completed' ? 'bg-green-600' :
                        automation.status === 'failed' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}
                      style={{ 
                        width: `${automation.totalJobs > 0 ? (automation.currentJob / automation.totalJobs) * 100 : 0}%` 
                      }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex justify-around pt-2 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{automation.successCount}</div>
                      <div className="text-xs text-gray-600">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{automation.failCount}</div>
                      <div className="text-xs text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {automation.totalJobs - automation.currentJob}
                      </div>
                      <div className="text-xs text-gray-600">Remaining</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">
                        Started: {new Date(automation.startedAt).toLocaleTimeString()}
                      </div>
                      {automation.completedAt && (
                        <div className="text-xs text-gray-500">
                          Completed: {new Date(automation.completedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                    disabled={!config.isActive || isRunning(config.id)}
                    onClick={() => runAutomatedApplication(config)}
                  >
                    {isRunning(config.id) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running...
                      </>
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