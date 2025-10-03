import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { JobBoardFactory, ApplicationTemplateEngine } from '@/lib/job-board-automation'
import type { SearchCriteria, ApplicationData, JobListing, AutoApplicationResult } from '@/lib/job-board-automation'

export async function POST(request: NextRequest) {
  try {
    const { configId, useRealAutomation = false } = await request.json()
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    // Get job board configuration
    const config = await db.getJobBoardConfig(configId)
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      )
    }

    if (!config.isActive) {
      return NextResponse.json(
        { success: false, error: 'Configuration is not active' },
        { status: 400 }
      )
    }

    // Get user information for template processing
    const user = await db.getUserById(config.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-apply route is working!',
      data: {
        configId,
        useRealAutomation,
        userEmail: user.email,
        maxApplications: config.applicationSettings.maxApplicationsPerDay
      }
    })

  } catch (error) {
    console.error('Auto-apply failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}