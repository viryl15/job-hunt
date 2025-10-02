'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Download, Eye, Camera } from 'lucide-react'

interface AutomationLogsProps {
  configId?: string
}

interface ConfigOption {
  id: string
  displayName: string
  lastActive: Date
  logCount: number
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  screenshot?: string
}

interface SessionReport {
  configId: string
  startTime: string
  endTime?: string
  totalApplications: number
  successfulApplications: number
  failedApplications: number
  errors: string[]
  screenshots: string[]
  duration?: string
}

export function AutomationLogs({ configId }: AutomationLogsProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [availableConfigs, setAvailableConfigs] = useState<ConfigOption[]>([])
  const [selectedConfig, setSelectedConfig] = useState(configId || '')
  const [logType, setLogType] = useState<'recent' | 'session' | 'all'>('recent')
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadAvailableConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/automation-configs')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableConfigs(data.data.configs || [])
          
          // Auto-select the most recent config if none is selected
          if (!selectedConfig && data.data.configs.length > 0) {
            setSelectedConfig(data.data.configs[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load configs:', error)
    }
  }, [selectedConfig])

  const fetchLogs = useCallback(async () => {
    if (!selectedConfig) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        configId: selectedConfig,
        type: logType
      })
      
      const response = await fetch(`/api/automation-logs?${params}`)
      const data = await response.json()
      
      if (data.success) {
        if (logType === 'session' && data.data.sessionReport) {
          setSessionReport(data.data.sessionReport)
        } else {
          setLogs(data.data.logs || [])
          setScreenshots(data.data.screenshots || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedConfig, logType])

  const getLiveLogs = useCallback(async () => {
    if (!selectedConfig) return
    
    try {
      const response = await fetch('/api/automation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: selectedConfig })
      })
      
      const data = await response.json()
      if (data.success) {
        setLogs(data.data.logs || [])
        scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to get live logs:', error)
    }
  }, [selectedConfig])

  useEffect(() => {
    if (selectedConfig) {
      fetchLogs()
    }
  }, [selectedConfig, logType, fetchLogs])

  useEffect(() => {
    if (autoRefresh && selectedConfig) {
      intervalRef.current = setInterval(getLiveLogs, 2000) // Refresh every 2 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, selectedConfig, getLiveLogs])

  // Load available configs on mount
  useEffect(() => {
    loadAvailableConfigs()
  }, [loadAvailableConfigs])

  // Load logs when selectedConfig or logType changes
  useEffect(() => {
    if (selectedConfig) {
      fetchLogs()
    }
  }, [selectedConfig, logType, fetchLogs])

  const parseLogEntry = (logLine: string): LogEntry | null => {
    // Parse format: [2024-01-15 10:30:45] [INFO] Message
    const match = logLine.match(/^\[([\d-\s:]+)\]\s+\[(\w+)\]\s+(.+)$/)
    if (!match) return null
    
    return {
      timestamp: match[1],
      level: match[2],
      message: match[3]
    }
  }

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'SUCCESS': return 'bg-green-100 text-green-800'
      case 'ERROR': return 'bg-red-100 text-red-800'
      case 'WARN': return 'bg-yellow-100 text-yellow-800'
      case 'INFO': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const downloadLogs = () => {
    const logContent = logs.join('\n')
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `automation-logs-${selectedConfig}-${new Date().toISOString().split('T')[0]}.log`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Automation Logs
        </CardTitle>
        <CardDescription>
          View real-time logs and screenshots from job application automation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Select value={selectedConfig} onValueChange={setSelectedConfig}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Job Board" />
              </SelectTrigger>
              <SelectContent>
                {availableConfigs.length === 0 ? (
                  <SelectItem value="">
                    No automation sessions found
                  </SelectItem>
                ) : (
                  availableConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.displayName} ({config.logCount} logs)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={logType} onValueChange={(value) => setLogType(value as 'recent' | 'session' | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent Logs</SelectItem>
                <SelectItem value="session">Session Report</SelectItem>
                <SelectItem value="all">All Logs</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadAvailableConfigs()
                fetchLogs()
              }}
              disabled={isLoading || !selectedConfig}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant={autoRefresh ? "destructive" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              disabled={!selectedConfig}
            >
              {autoRefresh ? '⏹ Stop Live' : '▶ Live View'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          <Tabs defaultValue="logs" className="w-full">
            <TabsList>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
              {sessionReport && <TabsTrigger value="session">Session Report</TabsTrigger>}
            </TabsList>

            <TabsContent value="logs">
              <div className="h-[500px] w-full border rounded-md p-4 overflow-y-auto">
                <div className="space-y-1 font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      {selectedConfig ? 'No logs available' : 'Select a job board to view logs'}
                    </div>
                  ) : (
                    logs.map((logLine, index) => {
                      const entry = parseLogEntry(logLine)
                      if (!entry) {
                        return (
                          <div key={index} className="text-muted-foreground">
                            {logLine}
                          </div>
                        )
                      }
                      
                      return (
                        <div key={index} className="flex gap-2 items-start py-1">
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {entry.timestamp}
                          </span>
                          <Badge variant="outline" className={`text-xs ${getLevelColor(entry.level)}`}>
                            {entry.level}
                          </Badge>
                          <span className="flex-1">{entry.message}</span>
                        </div>
                      )
                    })
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="screenshots">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screenshots.length === 0 ? (
                  <div className="col-span-full text-muted-foreground text-center py-8">
                    No screenshots available
                  </div>
                ) : (
                  screenshots.map((screenshot, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4">
                        <div 
                          className="flex items-center gap-2 mb-2"
                          onClick={() => setSelectedScreenshot(screenshot)}
                        >
                          <Camera className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Screenshot {index + 1}
                          </span>
                        </div>
                        <img
                          src={screenshot}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-32 object-cover rounded border"
                          onClick={() => setSelectedScreenshot(screenshot)}
                        />
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {sessionReport && (
              <TabsContent value="session">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {sessionReport.totalApplications}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {sessionReport.successfulApplications}
                        </div>
                        <div className="text-sm text-muted-foreground">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {sessionReport.failedApplications}
                        </div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {sessionReport.duration || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                      </div>
                    </div>
                    
                    {sessionReport.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Errors:</h4>
                        <div className="space-y-1">
                          {sessionReport.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Screenshot Modal */}
        {selectedScreenshot && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedScreenshot(null)}
          >
            <div className="max-w-4xl max-h-full overflow-auto">
              <img
                src={selectedScreenshot}
                alt="Full size screenshot"
                className="w-full h-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AutomationLogs