'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, Eye } from 'lucide-react'

interface TestResult {
  success: boolean
  message: string
  error?: string
  logs?: string[]
  screenshots?: string[]
}

export default function TestHelloWorkPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [headless, setHeadless] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const runTest = async () => {
    if (!email || !password) {
      setResult({
        success: false,
        message: 'Please enter both email and password',
        error: 'Missing credentials'
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, headless })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Test failed with network error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Test HelloWork Login with Cookie Consent
          </CardTitle>
          <CardDescription>
            Test the HelloWork automation with enhanced cookie consent handling.
            The automation will automatically handle the cookie modal that appears on HelloWork.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              HelloWork Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              HelloWork Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="headless"
              checked={headless}
              onChange={(e) => setHeadless(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="headless" className="text-sm">
              Run in headless mode (no browser window)
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Cookie Consent Handling</h4>
            <p className="text-sm text-blue-700">
              This test will automatically handle the HelloWork cookie consent modal by:
            </p>
            <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
              <li>Detecting the cookie modal when it appears</li>
              <li>Clicking "Continuer sans accepter" (preferred) or "Tout accepter"</li>
              <li>Taking screenshots before and after cookie handling</li>
              <li>Continuing with the normal login process</li>
            </ul>
          </div>

          <Button 
            onClick={runTest} 
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Testing HelloWork Login...' : 'Test HelloWork Login'}
          </Button>

          {result && (
            <Card className={`mt-4 ${result.success ? 'border-green-200' : 'border-red-200'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "SUCCESS" : "FAILED"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-2">{result.message}</p>
                    
                    {result.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}

                    {result.logs && result.logs.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold mb-2">Automation Logs:</h5>
                        <div className="bg-gray-50 border rounded p-2 max-h-48 overflow-y-auto">
                          {result.logs.map((log, index) => (
                            <div key={index} className="text-xs font-mono text-gray-700 mb-1">
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.screenshots && result.screenshots.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold mb-2">Screenshots Captured:</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {result.screenshots.map((screenshot, index) => (
                            <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                              {screenshot.split('/').pop()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              View detailed logs and screenshots in the{' '}
              <a href="/automation-logs" className="text-blue-600 hover:underline">
                Automation Logs
              </a>{' '}
              page after running the test.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}