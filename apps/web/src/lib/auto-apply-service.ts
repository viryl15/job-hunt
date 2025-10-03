import { db } from '@/lib/database'
import { JobBoardFactory, ApplicationTemplateEngine } from '@/lib/job-board-automation'
import type { SearchCriteria, ApplicationData, JobListing, AutoApplicationResult } from '@/lib/job-board-automation'

export async function runAutoApplyAutomation(configId: string, useRealAutomation: boolean = false) {
  // Get job board configuration
  const config = await db.getJobBoardConfig(configId)
  if (!config) {
    throw new Error('Configuration not found')
  }

  if (!config.isActive) {
    throw new Error('Configuration is not active')
  }

  // Get user information for template processing
  console.log(`Looking for user with ID: ${config.userId}`)
  const user = await db.getUserById(config.userId)
  if (!user) {
    throw new Error(`User not found for userId: ${config.userId}. Please make sure you're logged in and the configuration belongs to your account.`)
  }

  console.log(`Starting automated application for ${config.boardName}...`)
  console.log(`Real automation mode: ${useRealAutomation ? 'ENABLED' : 'DEMO MODE'}`)
  
  const automator = await JobBoardFactory.createAutomator(config, useRealAutomation)
  
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

  // Check if user wants to use custom template
  const useCustomTemplate = config.applicationSettings.useCustomTemplate !== false
  const template = useCustomTemplate ? (config.applicationSettings.coverLetterTemplate || ApplicationTemplateEngine.getDefaultCoverLetterTemplate()) : ''

  // Prepare user profile data for template processing
  const userProfile = {
    name: user.name || 'Candidat',
    experience: config.preferences.experienceLevel || '5 ans',
    skills: config.preferences.skills || []
  }

  // Search for jobs first
  const jobs = await automator.searchJobs(searchCriteria)
  
  console.log(`Found ${jobs.length} jobs, applying to up to ${config.applicationSettings.maxApplicationsPerDay} jobs`)

  const applications: AutoApplicationResult[] = []
  let applicationsSubmitted = 0
  
  // Apply to jobs individually with proper template processing
  for (let i = 0; i < jobs.length && applicationsSubmitted < config.applicationSettings.maxApplicationsPerDay; i++) {
    const job = jobs[i]
    
    try {
      // Check if we already applied to this job to prevent duplicates
      const existingApplication = await db.getApplicationLogs(config.id)
      const alreadyApplied = existingApplication.some((log) => 
        log.jobId === job.id || log.jobId === job.url
      )

      if (alreadyApplied) {
        console.log(`⚠️ Skipping job "${job.title}" - already applied`)
        continue
      }

      // Process template for this specific job (if using custom template)
      let processedCoverLetter = ''
      if (useCustomTemplate && template) {
        processedCoverLetter = ApplicationTemplateEngine.generateCoverLetter(template, job, userProfile)
      }

      // Create job-specific application data
      const jobApplicationData: ApplicationData = {
        coverLetter: processedCoverLetter,
        customMessage: config.applicationSettings.customMessage || '',
        answers: {}
      }

      console.log(`Applying to: ${job.title} at ${job.company}`)
      console.log(`Using custom template: ${useCustomTemplate}`)
      if (useCustomTemplate) {
        console.log(`Cover letter preview: ${processedCoverLetter.substring(0, 100)}...`)
      }

      // Apply to the job
      const appResult = await automator.applyToJob(job.id, jobApplicationData)
      applications.push(appResult)

      if (appResult.success) {
        applicationsSubmitted++
        console.log(`✅ Successfully applied to: ${job.title}`)
      } else {
        console.log(`❌ Failed to apply to: ${job.title} - ${appResult.message}`)
      }

      // Log application attempt to database
      await db.logApplication({
        jobId: job.url, // Use URL as unique identifier
        jobBoardConfigId: config.id,
        status: appResult.success ? 'applied' : 'failed',
        appliedAt: appResult.success ? new Date() : undefined,
        response: appResult.message,
        followUpRequired: false,
        notes: appResult.error || undefined
      })

      // Add random delay between 5-8 seconds before processing next job
      const delayMs = Math.floor(Math.random() * 3000) + 5000 // Random between 5000-8000ms
      console.log(`Waiting ${(delayMs / 1000).toFixed(1)} seconds before next application...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))

    } catch (error) {
      console.error(`Error applying to job ${job.title}:`, error)
      const failedResult: AutoApplicationResult = {
        success: false,
        jobId: job.id,
        message: 'Application failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      applications.push(failedResult)

      // Log failed application
      await db.logApplication({
        jobId: job.url,
        jobBoardConfigId: config.id,
        status: 'failed',
        response: failedResult.message,
        followUpRequired: false,
        notes: failedResult.error || undefined
      })
    }
  }

  // Prepare results for response
  const results = applications.map(appResult => {
    const job = jobs.find((j: JobListing) => j.id === appResult.jobId || j.url === appResult.jobId)
    return {
      jobId: appResult.jobId,
      jobTitle: job?.title || 'Unknown Job',
      company: job?.company || 'Unknown Company',
      success: appResult.success,
      message: appResult.message
    }
  })

  await automator.logout()
  
  return {
    totalJobsFound: jobs.length,
    applicationsSubmitted,
    results
  }
}
