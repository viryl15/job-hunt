import { db, query } from '@/lib/database'
import { JobBoardFactory, ApplicationTemplateEngine } from '@/lib/job-board-automation'
import type { SearchCriteria, ApplicationData, JobListing, AutoApplicationResult } from '@/lib/job-board-automation'
import { calculateSkillMatch, formatMatchResult } from '@/lib/skill-matcher'

// Type for progress callback function
type ProgressCallback = (update: {
  type: 'progress'
  data: {
    configId: string
    currentJob: number
    totalJobs: number
    currentJobTitle: string
    status: 'starting' | 'running' | 'completed' | 'failed'
    successCount: number
    failCount: number
    skippedCount?: number
  }
}) => void

export async function runAutoApplyAutomation(
  configId: string, 
  useRealAutomation: boolean = false,
  onProgress?: ProgressCallback
) {
  try {
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
    
    // Initialize progress
    onProgress?.({
      type: 'progress',
      data: {
        configId,
        currentJob: 0,
        totalJobs: 0,
        currentJobTitle: 'Logging in to job board...',
        status: 'starting',
        successCount: 0,
        failCount: 0,
        skippedCount: 0
      }
    })
    
    const automator = await JobBoardFactory.createAutomator(config, useRealAutomation)
    
    // Login to job board
    const loginSuccess = await automator.login()
    if (!loginSuccess) {
      throw new Error('Failed to login to job board')
    }

    // Search for jobs based on preferences
    onProgress?.({
      type: 'progress',
      data: {
        configId,
        currentJob: 0,
        totalJobs: 0,
        currentJobTitle: 'Searching for jobs...',
        status: 'running',
        successCount: 0,
        failCount: 0,
        skippedCount: 0
      }
    })

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

    // Initialize progress with total jobs count
    const maxApplications = Math.min(jobs.length, config.applicationSettings.maxApplicationsPerDay || 10)

    const applications: AutoApplicationResult[] = []
    let applicationsSubmitted = 0
    let skippedCount = 0
  
  // Apply to jobs individually with proper template processing
  for (let i = 0; i < jobs.length && applicationsSubmitted < config.applicationSettings.maxApplicationsPerDay; i++) {
    const job = jobs[i]
    
    // Update progress before processing each job
    onProgress?.({
      type: 'progress',
      data: {
        configId,
        currentJob: i + 1,
        totalJobs: maxApplications,
        currentJobTitle: `Processing: ${job.title} at ${job.company}`,
        status: 'running',
        successCount: applicationsSubmitted,
        failCount: i - applicationsSubmitted - skippedCount,
        skippedCount
      }
    })
    
    try {
      // Check if we already applied to this job by checking if job exists in database
      // with same source and sourceId
      const existingJob = await query(
        'SELECT id FROM job WHERE source = ? AND sourceId = ?',
        [config.boardName, job.id]
      )

      if (existingJob.length > 0) {
        // Check if we have an application for this job
        const existingApp = await query(
          'SELECT id FROM application WHERE jobId = ? AND userId = ?',
          [existingJob[0].id, config.userId]
        )
        
        if (existingApp.length > 0) {
          console.log(`⚠️ Skipping job "${job.title}" - already applied (found in database)`)
          skippedCount++
          continue
        }
      }

      // ===== SKILL MATCHING CHECK =====
      // Get the skill match threshold (default 60%)
      const skillMatchThreshold = config.applicationSettings.skillMatchThreshold || 60
      const userSkills = config.preferences.skills || []
      
      // Only perform skill matching if user has skills configured
      if (userSkills.length > 0) {
        // Fetch full job description from detail page for accurate skill matching
        let fullDescription = job.description || ''
        
        // If the automator has a getJobDescription method, use it to get the full description
        // Check if method exists (only RealHelloWorkAutomator has this method currently)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ('getJobDescription' in automator && typeof (automator as any).getJobDescription === 'function') {
          try {
            console.log(`🔍 Fetching full job description for skill matching...`)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fullDescription = await (automator as any).getJobDescription(job.url)
          } catch {
            console.log(`⚠️ Could not fetch full description, using title only for skill matching`)
          }
        }
        
        const skillMatch = calculateSkillMatch(
          userSkills,
          job.title,
          fullDescription
        )
        
        console.log(`\n📊 Skill Match Analysis for "${job.title}":`)
        console.log(formatMatchResult(skillMatch))
        console.log(`Threshold: ${skillMatchThreshold}%\n`)
        
        // Skip job if skill match is below threshold
        if (skillMatch.percentage < skillMatchThreshold) {
          console.log(`⏭️ Skipping job "${job.title}" - skill match too low (${skillMatch.percentage}% < ${skillMatchThreshold}%)`)
          console.log(`   Missing skills: ${skillMatch.missingSkills.join(', ')}`)
          skippedCount++
          continue
        } else {
          console.log(`✅ Skill match acceptable (${skillMatch.percentage}% >= ${skillMatchThreshold}%) - proceeding with application`)
        }
      }
      // ===== END SKILL MATCHING CHECK =====

      // Process template for this specific job (if using custom template)
      let processedCoverLetter = ''
      if (useCustomTemplate && template) {
        processedCoverLetter = ApplicationTemplateEngine.generateCoverLetter(template, job, userProfile)
      }

      // Build address string from user profile data
      let address = ''
      if (user.city && user.postalCode) {
        address = `${user.city} - ${user.postalCode}`
      } else if (user.city) {
        address = user.city
      } else if (config.credentials.address) {
        address = config.credentials.address
      }

      // Create job-specific application data
      const jobApplicationData: ApplicationData = {
        coverLetter: processedCoverLetter,
        customMessage: config.applicationSettings.customMessage || '',
        answers: {},
        phone: user.phone || config.credentials.phone, // Prioritize user profile phone
        address: address // Use formatted address from user profile
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

      // Create or update job record in the database
      const jobId = await db.createOrUpdateJob({
        source: config.boardName,
        sourceId: job.id,
        title: job.title,
        company: job.company,
        locations: job.location ? [job.location] : [],
        remote: job.location?.toLowerCase().includes('remote') || false,
        url: job.url,
        description: job.description || '',
        salaryMin: typeof job.salary === 'object' ? job.salary?.min : undefined,
        salaryMax: typeof job.salary === 'object' ? job.salary?.max : undefined,
        currency: typeof job.salary === 'object' ? job.salary?.currency : undefined,
        tags: [],
        postedAt: job.postedDate
      })

      // Create application record in the main application table
      const appParams: {
        jobId: string
        userId: string
        status: 'APPLIED' | 'FAILED'
        channel: 'FORM'
        coverText?: string
        notes: string
        resumePath?: string
        contactEmail?: string
      } = {
        jobId: jobId,
        userId: config.userId,
        status: appResult.success ? 'APPLIED' : 'FAILED',
        channel: 'FORM',
        notes: appResult.success 
          ? `Auto-applied via ${config.boardName}`
          : `Failed to apply via ${config.boardName}: ${appResult.message}${appResult.error ? ` - ${appResult.error}` : ''}`
      }
      
      if (appResult.success && processedCoverLetter) {
        appParams.coverText = processedCoverLetter
      }
      
      await db.createApplication(appParams)

      // Log application attempt to application_log table (for automation tracking)
      const logParams: {
        jobId: string
        jobBoardConfigId: string
        status: 'applied' | 'failed'
        appliedAt?: Date
        response: string
        followUpRequired: boolean
        notes?: string
      } = {
        jobId: job.url,
        jobBoardConfigId: config.id,
        status: appResult.success ? 'applied' : 'failed',
        response: appResult.message,
        followUpRequired: false
      }
      
      if (appResult.success) {
        logParams.appliedAt = new Date()
      }
      
      if (appResult.error) {
        logParams.notes = appResult.error
      }
      
      await db.logApplication(logParams)
      
      // Update progress after application attempt
      onProgress?.({
        type: 'progress',
        data: {
          configId,
          currentJob: i + 1,
          totalJobs: maxApplications,
          currentJobTitle: appResult.success 
            ? `✅ Applied: ${job.title}` 
            : `❌ Failed: ${job.title}`,
          status: 'running',
          successCount: applicationsSubmitted,
          failCount: applications.length - applicationsSubmitted,
          skippedCount
        }
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

  // Update progress to completed
  onProgress?.({
    type: 'progress',
    data: {
      configId,
      currentJob: maxApplications,
      totalJobs: maxApplications,
      currentJobTitle: 'Automation completed!',
      status: 'completed',
      successCount: applicationsSubmitted,
      failCount: applications.length - applicationsSubmitted,
      skippedCount
    }
  })

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
  } catch (error) {
    // Update progress to failed on error
    if (configId) {
      onProgress?.({
        type: 'progress',
        data: {
          configId,
          currentJob: 0,
          totalJobs: 0,
          currentJobTitle: 'Automation failed',
          status: 'failed',
          successCount: 0,
          failCount: 0
        }
      })
    }
    throw error
  }
}
