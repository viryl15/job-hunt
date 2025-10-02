import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { z } from 'zod'

// Validation schema for job ingestion
const JobIngestSchema = z.object({
  source: z.string(),
  sourceId: z.string().optional(),
  title: z.string(),
  company: z.string(),
  locations: z.array(z.string()),
  remote: z.boolean().default(false),
  url: z.string().url(),
  description: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  currency: z.string().optional(),
  tags: z.array(z.string()),
  postedAt: z.string().datetime().optional(),
})

type JobIngestData = z.infer<typeof JobIngestSchema>

// Deterministic scoring algorithm
function calculateJobScore(job: JobIngestData, userSkills: string[] = []): number {
  let score = 0
  
  // Title scoring (40 points max)
  const title = job.title.toLowerCase()
  if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
    score += 15
  } else if (title.includes('mid') || title.includes('intermediate')) {
    score += 10
  } else if (title.includes('junior') || title.includes('entry')) {
    score += 5
  }
  
  // Base role points
  if (title.includes('engineer') || title.includes('developer')) score += 25
  
  // Skills matching (30 points max)
  const jobSkills = job.tags.map(tag => tag.toLowerCase())
  const skillMatches = userSkills.filter(skill => 
    jobSkills.some(jobSkill => jobSkill.includes(skill.toLowerCase()))
  )
  score += Math.min(skillMatches.length * 5, 30)
  
  // Remote work preference (15 points)
  if (job.remote) score += 15
  
  // Salary information available (10 points)
  if (job.salaryMin || job.salaryMax) score += 10
  
  // Recent posting (5 points)
  if (job.postedAt) {
    const postedDate = new Date(job.postedAt)
    const daysSincePosted = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePosted <= 7) score += 5
  }
  
  return Math.min(score, 100) // Cap at 100 points
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = JobIngestSchema.parse(body)
    
    // Check for duplicates by URL
    const existingJob = await db.findJobByUrl(validatedData.url)
    
    if (existingJob) {
      return NextResponse.json({
        success: false,
        message: 'Job already exists',
        jobId: existingJob.id
      }, { status: 409 })
    }
    
    // Calculate initial score (without user-specific skills for now)
    const score = calculateJobScore(validatedData)
    
    // Create job record
    const jobId = await db.createJob({
      source: validatedData.source,
      sourceId: validatedData.sourceId,
      title: validatedData.title,
      company: validatedData.company,
      locations: validatedData.locations,
      remote: validatedData.remote,
      url: validatedData.url,
      description: validatedData.description,
      salaryMin: validatedData.salaryMin,
      salaryMax: validatedData.salaryMax,
      currency: validatedData.currency,
      tags: validatedData.tags,
      postedAt: validatedData.postedAt ? new Date(validatedData.postedAt) : undefined,
      score,
    })
    
    return NextResponse.json({
      success: true,
      message: 'Job ingested successfully',
      job: {
        id: jobId,
        title: validatedData.title,
        company: validatedData.company,
        score: score
      }
    })
    
  } catch (error) {
    console.error('Job ingestion error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// Batch ingestion endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const jobs = z.array(JobIngestSchema).parse(body)
    
    const results = {
      created: 0,
      duplicates: 0,
      errors: 0,
      jobs: [] as any[]
    }
    
    for (const jobData of jobs) {
      try {
        // Check for duplicates
        const existingJob = await db.findJobByUrl(jobData.url)
        
        if (existingJob) {
          results.duplicates++
          continue
        }
        
        // Calculate score and create job
        const score = calculateJobScore(jobData)
        const jobId = await db.createJob({
          source: jobData.source,
          sourceId: jobData.sourceId,
          title: jobData.title,
          company: jobData.company,
          locations: jobData.locations,
          remote: jobData.remote,
          url: jobData.url,
          description: jobData.description,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency,
          tags: jobData.tags,
          postedAt: jobData.postedAt ? new Date(jobData.postedAt) : undefined,
          score,
        })
        
        results.created++
        results.jobs.push({
          id: jobId,
          title: jobData.title,
          company: jobData.company,
          score: score
        })
        
      } catch (error) {
        console.error(`Error ingesting job ${jobData.title}:`, error)
        results.errors++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Batch ingestion completed: ${results.created} created, ${results.duplicates} duplicates, ${results.errors} errors`,
      results
    })
    
  } catch (error) {
    console.error('Batch ingestion error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}