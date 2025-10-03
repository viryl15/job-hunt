import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('[Applied Jobs API] Session:', session?.user?.email)
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Get user from database
    const user = await db.getUserByEmail(session.user.email!)
    console.log('[Applied Jobs API] User found:', user?.id)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Get applied jobs from the main application table
    const applications = await db.getUserApplicationsFromMainTable(user.id)
    console.log('[Applied Jobs API] Applications found:', applications.length)
    
    // Get summary statistics
    const totalApplications = applications.length
    const appliedApplications = applications.filter(app => app.status === 'APPLIED').length
    const screeningApplications = applications.filter(app => app.status === 'SCREEN').length
    const interviewApplications = applications.filter(app => ['TECH', 'ONSITE'].includes(app.status)).length
    const offerApplications = applications.filter(app => app.status === 'OFFER').length
    const hiredApplications = applications.filter(app => app.status === 'HIRED').length
    const rejectedApplications = applications.filter(app => app.status === 'REJECTED').length
    
    // Group applications by status for pipeline view
    const applicationsByStatus = {
      LEAD: applications.filter(app => app.status === 'LEAD'),
      APPLIED: applications.filter(app => app.status === 'APPLIED'),
      SCREEN: applications.filter(app => app.status === 'SCREEN'),
      TECH: applications.filter(app => app.status === 'TECH'),
      ONSITE: applications.filter(app => app.status === 'ONSITE'),
      OFFER: applications.filter(app => app.status === 'OFFER'),
      HIRED: applications.filter(app => app.status === 'HIRED'),
      REJECTED: applications.filter(app => app.status === 'REJECTED')
    }
    
    // Group applications by date for chart data
    const applicationsByDate = applications.reduce((acc: { [key: string]: number }, app) => {
      const date = new Date(app.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        applications: applications,
        applicationsByStatus: applicationsByStatus,
        statistics: {
          total: totalApplications,
          applied: appliedApplications,
          screening: screeningApplications,
          interview: interviewApplications,
          offer: offerApplications,
          hired: hiredApplications,
          rejected: rejectedApplications,
          successRate: totalApplications > 0 ? Math.round(((hiredApplications + offerApplications) / totalApplications) * 100) : 0
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