import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

// API route for job board configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'user_123' // Mock user ID
    
    const configs = await db.getJobBoardConfigs(userId)
    
    return NextResponse.json({
      success: true,
      data: configs
    })
  } catch (error) {
    console.error('Failed to fetch job board configs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configurations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'user_123', ...configData } = body
    
    const configId = await db.createJobBoardConfig({
      userId,
      ...configData
    })
    
    return NextResponse.json({
      success: true,
      data: { id: configId }
    })
  } catch (error) {
    console.error('Failed to create job board config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      )
    }
    
    await db.updateJobBoardConfig(id, updates)
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    })
  } catch (error) {
    console.error('Failed to update job board config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}