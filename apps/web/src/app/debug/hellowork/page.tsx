'use client'

import { useState } from 'react'

export default function HelloWorkDebug() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const testLoginButton = async () => {
    setIsLoading(true)
    setError('')
    setDebugResult(null)

    try {
      const response = await fetch('/api/hellowork/test-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test.email@example.com', // Replace with actual HelloWork test credentials
          password: 'testpass123'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Request failed')
        return
      }

      setDebugResult(data.debugInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">HelloWork Login Button Debug</h1>
      
      <div className="mb-4">
        <button
          onClick={testLoginButton}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Login Button Detection'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {debugResult && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Available Buttons</h2>
            <div className="bg-gray-100 p-4 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(debugResult.availableButtons, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Buttons by Text Content</h2>
            <div className="bg-gray-100 p-4 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(debugResult.buttonsByText, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Selector Test Results</h2>
            <div className="bg-gray-100 p-4 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(debugResult.selectorResults, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Page Info</h2>
            <p><strong>URL:</strong> {debugResult.pageUrl}</p>
            <p><strong>Timestamp:</strong> {debugResult.timestamp}</p>
          </div>
        </div>
      )}
    </div>
  )
}