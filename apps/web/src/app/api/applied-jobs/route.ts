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

    // Get query parameters for search, status filter, and pagination
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    console.log('[Applied Jobs API] Query params - status:', statusFilter, 'search:', search, 'page:', page)

    // Get applied jobs from the main application table
    let applications = await db.getUserApplicationsFromMainTable(user.id)
    console.log('[Applied Jobs API] Applications found:', applications.length)
    
    // Log all unique statuses in the database
    const uniqueStatuses = [...new Set(applications.map(app => app.status))]
    console.log('[Applied Jobs API] Unique statuses in DB:', uniqueStatuses)
    
    // Calculate statistics from ALL applications (before filtering)
    const allApplicationsFromDB = applications
    const totalApplicationsCount = allApplicationsFromDB.length
    const appliedApplications = allApplicationsFromDB.filter(app => app.status === 'APPLIED').length
    const failedApplications = allApplicationsFromDB.filter(app => app.status === 'FAILED').length
    const screeningApplications = allApplicationsFromDB.filter(app => app.status === 'SCREEN').length
    const interviewApplications = allApplicationsFromDB.filter(app => ['TECH', 'ONSITE'].includes(app.status)).length
    const offerApplications = allApplicationsFromDB.filter(app => app.status === 'OFFER').length
    const hiredApplications = allApplicationsFromDB.filter(app => app.status === 'HIRED').length
    const rejectedApplications = allApplicationsFromDB.filter(app => app.status === 'REJECTED').length
    
    // Filter applications by status
    if (statusFilter && statusFilter !== 'ALL') {
      const beforeFilter = applications.length
      applications = applications.filter(app => app.status === statusFilter)
      console.log('[Applied Jobs API] Filtered by status:', statusFilter, '- Results:', applications.length, '(was:', beforeFilter + ')')
    }
    
    // Filter applications by search term (title, company, or location)
    if (search) {
      const searchLower = search.toLowerCase()
      applications = applications.filter(app => 
        (app.title && app.title.toLowerCase().includes(searchLower)) ||
        (app.company && app.company.toLowerCase().includes(searchLower)) ||
        (app.locations && app.locations.some((loc: string) => loc.toLowerCase().includes(searchLower)))
      )
      console.log('[Applied Jobs API] Filtered by search:', applications.length)
    }
    
    // Paginate applications (after all filtering)
    const paginatedApplications = applications.slice(offset, offset + limit)
    const filteredCount = applications.length
    
    // Group applications by status for pipeline view (use all applications from DB, not filtered)
    const applicationsByStatus = {
      LEAD: allApplicationsFromDB.filter(app => app.status === 'LEAD'),
      APPLIED: allApplicationsFromDB.filter(app => app.status === 'APPLIED'),
      FAILED: allApplicationsFromDB.filter(app => app.status === 'FAILED'),
      SCREEN: allApplicationsFromDB.filter(app => app.status === 'SCREEN'),
      TECH: allApplicationsFromDB.filter(app => app.status === 'TECH'),
      ONSITE: allApplicationsFromDB.filter(app => app.status === 'ONSITE'),
      OFFER: allApplicationsFromDB.filter(app => app.status === 'OFFER'),
      HIRED: allApplicationsFromDB.filter(app => app.status === 'HIRED'),
      REJECTED: allApplicationsFromDB.filter(app => app.status === 'REJECTED')
    }
    
    // Group applications by date for chart data (use all applications from DB)
    const applicationsByDate = allApplicationsFromDB.reduce((acc: { [key: string]: number }, app) => {
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
          total: filteredCount,
          totalPages: Math.ceil(filteredCount / limit),
          hasMore: offset + limit < filteredCount
        },
        statistics: {
          total: totalApplicationsCount,
          applied: appliedApplications,
          failed: failedApplications,
          screening: screeningApplications,
          interview: interviewApplications,
          offer: offerApplications,
          hired: hiredApplications,
          rejected: rejectedApplications,
          successRate: totalApplicationsCount > 0 ? Math.round(((hiredApplications + offerApplications) / totalApplicationsCount) * 100) : 0
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