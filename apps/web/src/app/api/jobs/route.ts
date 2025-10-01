import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const source = searchParams.get('source') || undefined
    const remote = searchParams.get('remote')
    const search = searchParams.get('search') || undefined
    const minScore = parseInt(searchParams.get('minScore') || '0')
    const orderBy = searchParams.get('orderBy') || 'score'
    const order = (searchParams.get('order') || 'desc').toUpperCase() as 'ASC' | 'DESC'
    
    // Get jobs with filtering
    const jobs = await db.getJobs({
      limit,
      offset: (page - 1) * limit,
      source,
      remote: remote === 'true' ? true : undefined,
      search,
      minScore,
      orderBy,
      order
    })
    
    // Get total count (simplified - just get all matching jobs count)
    const allJobs = await db.getJobs({
      source,
      remote: remote === 'true' ? true : undefined,
      search,
      minScore
    })
    const total = allJobs.length
    
    return NextResponse.json({
      success: true,
      data: {
        jobs: jobs.map((job: Record<string, any>) => ({
          ...job,
          remote: Boolean(job.remote),
          locations: typeof job.locations === 'string' ? JSON.parse(job.locations) : job.locations,
          tags: typeof job.tags === 'string' ? JSON.parse(job.tags) : job.tags
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          source,
          remote,
          search,
          minScore,
          orderBy,
          order
        }
      }
    })
    
  } catch (error) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Simplified - skip auth for now
    const body = await request.json()
    const { jobId, action } = body
    
    if (!jobId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Missing jobId or action'
      }, { status: 400 })
    }
    
    // For now, just return success - we can implement hide/show later
    return NextResponse.json({
      success: true,
      message: `Job ${action} action received`,
      jobId,
      action
    })
    
  } catch (error) {
    console.error('Job action error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}