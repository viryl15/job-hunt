import { NextRequest, NextResponse } from 'next/server'
import { getProgress } from '@/lib/progress-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    const progress = getProgress(configId)
    
    return NextResponse.json({
      success: true,
      data: progress
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
