import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import JobAggregator from '@/lib/job-scraper'

// Real job scraping endpoint
export async function POST(request: NextRequest) {
  try {
    const { 
      sources = ['indeed', 'linkedin'], 
      location = 'France',
      remoteOnly = false,
      limit = 100
    } = await request.json().catch(() => ({}))
    
    console.log('Starting real job scraping with options:', { sources, location, remoteOnly, limit })
    
    const aggregator = new JobAggregator()
    const jobs = await aggregator.scrapeJobs({ sources, location, remoteOnly, limit })
    
    console.log(`Scraped ${jobs.length} real jobs`)
    
    // Store jobs in database
    const storedJobs = []
    let duplicates = 0
    
    for (const jobData of jobs) {
      try {
        // Check for duplicates by URL
        const existing = await db.findJobByUrl(jobData.url)
        if (existing) {
          duplicates++
          continue
        }
        
        // Store the job
        const jobId = await db.createJob({
          source: jobData.source,
          sourceId: jobData.sourceId,
          title: jobData.title,
          company: jobData.company,
          locations: jobData.location ? [jobData.location] : ['Remote'],
          remote: jobData.remote,
          url: jobData.url,
          description: jobData.description,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency || 'USD',
          tags: jobData.tags,
          postedAt: jobData.postedAt,
          score: jobData.score || 50
        })
        
        storedJobs.push({
          id: jobId,
          title: jobData.title,
          company: jobData.company,
          score: jobData.score || 50,
          source: jobData.source
        })
      } catch (error) {
        console.error('Error storing job:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully scraped and stored ${storedJobs.length} new jobs`,
      data: {
        totalScraped: jobs.length,
        newJobs: storedJobs.length,
        duplicatesSkipped: duplicates,
        jobs: storedJobs,
        sources: ['RemoteOK', 'Remotive']
      }
    })
    
  } catch (error) {
    console.error('Job scraping failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get scraping status
export async function GET() {
  try {
    const totalJobs = await db.countJobs()
    const recentJobs = await db.getJobs({ limit: 5, orderBy: 'createdAt' })
    
    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        recentJobs: recentJobs.map((job) => ({
          title: job.title,
          company: job.company,
          source: job.source,
          score: job.score,
          createdAt: job.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Error getting scraping status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    )
  }
}