import { NextRequest, NextResponse } from 'next/server'
import { getProgress, getAllProgress } from '@/lib/progress-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')
    
    // If configId is provided, return specific automation progress
    if (configId) {
      const progress = getProgress(configId)
      return NextResponse.json({
        success: true,
        data: progress
      })
    }
    
    // Otherwise, return all running automations
    const allProgress = getAllProgress()
    return NextResponse.json({
      success: true,
      data: allProgress
    })
  } catch (error) {
    console.error('Failed to get progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
