import { NextResponse } from 'next/server'
import { query } from '@/lib/prisma'

export async function GET() {
  try {
    // Test basic query
    const jobs = await query('SELECT * FROM job LIMIT 5')
    
    return NextResponse.json({
      success: true,
      message: 'Direct query successful',
      jobs: jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        score: job.score,
        locations: job.locations,
        tags: job.tags
      })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Direct query error:', error)
    return NextResponse.json({
      success: false,
      message: 'Direct query failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}