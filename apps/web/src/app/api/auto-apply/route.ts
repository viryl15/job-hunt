import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { JobBoardFactory, SearchCriteria, ApplicationData } from '@/lib/job-board-automation'

export async function POST(request: NextRequest) {
  try {
    const { configId } = await request.json()
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    // Get the job board configuration
    const configs = await db.getJobBoardConfigs('user_123') // Mock user ID
    const config = configs.find(c => c.id === configId)
    
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

    console.log(`Starting automated application for ${config.boardName}...`)
    
    const automator = JobBoardFactory.createAutomator(config)
    
    // Login to job board
    const loginSuccess = await automator.login()
    if (!loginSuccess) {
      throw new Error('Failed to login to job board')
    }

    // Search for jobs based on preferences
    const searchCriteria: SearchCriteria = {
      keywords: config.preferences.skills,
      location: config.preferences.locations[0] || 'France',
      salaryMin: config.preferences.salaryMin,
      salaryMax: config.preferences.salaryMax,
      remote: config.preferences.remotePreference === 'remote'
    }

    const jobs = await automator.searchJobs(searchCriteria)
    console.log(`Found ${jobs.length} matching jobs`)

    let applicationsSubmitted = 0
    const maxApplications = config.applicationSettings.maxApplicationsPerDay
    const results = []

    for (const job of jobs.slice(0, maxApplications)) {
      try {
        // Generate personalized application
        const applicationData: ApplicationData = {
          coverLetter: config.applicationSettings.coverLetterTemplate || '',
          customMessage: config.applicationSettings.customMessage,
          answers: {} // Additional form answers if needed
        }

        // Apply to job
        const result = await automator.applyToJob(job.id, applicationData)
        
        // Log application attempt
        await db.logApplication({
          jobId: job.id,
          jobBoardConfigId: config.id,
          status: result.success ? 'applied' : 'failed',
          appliedAt: result.success ? new Date() : undefined,
          response: result.message,
          followUpRequired: false,
          notes: result.error || undefined
        })

        results.push({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          success: result.success,
          message: result.message
        })

        if (result.success) {
          applicationsSubmitted++
          console.log(`Successfully applied to: ${job.title} at ${job.company}`)
        } else {
          console.log(`Failed to apply to: ${job.title} - ${result.message}`)
        }

        // Add delay between applications to avoid being flagged
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Error applying to job ${job.id}:`, error)
        results.push({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    await automator.logout()
    
    return NextResponse.json({
      success: true,
      message: `Automation completed! Applied to ${applicationsSubmitted} jobs.`,
      data: {
        totalJobsFound: jobs.length,
        applicationsSubmitted,
        results
      }
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