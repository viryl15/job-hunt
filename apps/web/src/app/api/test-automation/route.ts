import { NextRequest, NextResponse } from 'next/server'
import { runAutomationTest } from '@/lib/automation-tester'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting automation test...')
    
    // Run the test in the background
    runAutomationTest().catch(console.error)
    
    return NextResponse.json({
      success: true,
      message: 'Automation test started in background. Check logs for progress.'
    })

  } catch (error) {
    console.error('Failed to start automation test:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start automation test' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Automation test endpoint available. Send POST request to start test.'
  })
}