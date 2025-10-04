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

    // Get query parameters for search and pagination
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get applied jobs from the main application table
    let applications = await db.getUserApplicationsFromMainTable(user.id)
    console.log('[Applied Jobs API] Applications found:', applications.length)
    
    // Filter applications by search term (title, company, or location)
    if (search) {
      const searchLower = search.toLowerCase()
      applications = applications.filter(app => 
        (app.title && app.title.toLowerCase().includes(searchLower)) ||
        (app.company && app.company.toLowerCase().includes(searchLower)) ||
        (app.locations && app.locations.some((loc: string) => loc.toLowerCase().includes(searchLower)))
      )
      console.log('[Applied Jobs API] Filtered applications:', applications.length)
    }
    
    // Paginate applications
    const paginatedApplications = applications.slice(offset, offset + limit)
    
    // Get summary statistics (use all applications, not paginated ones)
    const allApplicationsCount = applications.length
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
        applications: paginatedApplications,
        applicationsByStatus: applicationsByStatus,
        pagination: {
          page,
          limit,
          total: allApplicationsCount,
          totalPages: Math.ceil(allApplicationsCount / limit),
          hasMore: offset + limit < allApplicationsCount
        },
        statistics: {
          total: allApplicationsCount,
          applied: appliedApplications,
          screening: screeningApplications,
          interview: interviewApplications,
          offer: offerApplications,
          hired: hiredApplications,
          rejected: rejectedApplications,
          successRate: allApplicationsCount > 0 ? Math.round(((hiredApplications + offerApplications) / allApplicationsCount) * 100) : 0
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