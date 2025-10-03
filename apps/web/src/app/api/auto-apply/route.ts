import { NextRequest, NextResponse } from 'next/server'
import { runAutoApplyAutomation } from '@/lib/auto-apply-service'

export async function POST(request: NextRequest) {
  try {
    const { configId, useRealAutomation = false } = await request.json()
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    const data = await runAutoApplyAutomation(configId, useRealAutomation)
    
    return NextResponse.json({
      success: true,
      message: `Automation completed! Applied to ${data.applicationsSubmitted} jobs.`,
      data
    })
  } catch (error) {
    console.error('Automation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

