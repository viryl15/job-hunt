import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection and query
    const jobCount = await db.countJobs()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      jobCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}