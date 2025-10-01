import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Single test job
    const testJob = {
      source: "test",
      sourceId: "test-debug-001",
      title: "Test Developer",
      company: "Test Company",
      locations: ["Remote"],
      remote: true,
      url: "https://example.com/jobs/test-debug-001",
      description: "This is a test job for debugging purposes",
      salaryMin: 80000,
      salaryMax: 120000,
      currency: "USD",
      tags: ["JavaScript", "React"],
      postedAt: new Date().toISOString()
    }

    console.log('Sending test job:', JSON.stringify(testJob, null, 2))

    // Send to ingestion API
    const response = await fetch('http://localhost:3000/api/jobs/ingest', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testJob)
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response body:', responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { rawResponse: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      testJob,
      response: result
    })

  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}