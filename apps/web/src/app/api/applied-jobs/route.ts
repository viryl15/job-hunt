import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Get user from database
    const user = await db.getUserByEmail(session.user.email!)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Get applied jobs for this user
    const appliedJobs = await db.getUserApplications(user.id)
    
    // Get summary statistics
    const totalApplications = appliedJobs.length
    const successfulApplications = appliedJobs.filter(app => app.status === 'applied').length
    const failedApplications = appliedJobs.filter(app => app.status === 'failed').length
    
    // Group applications by date for chart data
    const applicationsByDate = appliedJobs.reduce((acc: { [key: string]: number }, app) => {
      if (app.appliedAt) {
        const date = new Date(app.appliedAt).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
      }
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        applications: appliedJobs,
        statistics: {
          total: totalApplications,
          successful: successfulApplications,
          failed: failedApplications,
          successRate: totalApplications > 0 ? Math.round((successfulApplications / totalApplications) * 100) : 0
        },
        chartData: Object.entries(applicationsByDate).map(([date, count]) => ({
          date,
          applications: count
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching applied jobs:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch applied jobs data' 
    }, { status: 500 })
  }
}