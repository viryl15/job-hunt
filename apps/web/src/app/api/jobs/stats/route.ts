import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get job statistics
    const [
      totalJobs,
      remoteJobs,
      recentJobs,
      topCompanies,
      topSources,
      scoreDistribution
    ] = await Promise.all([
      // Total jobs count
      prisma.job.count({ where: { hidden: false } }),
      
      // Remote jobs count
      prisma.job.count({ where: { hidden: false, remote: true } }),
      
      // Jobs posted in last 7 days
      prisma.job.count({
        where: {
          hidden: false,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Top 10 companies by job count
      prisma.job.groupBy({
        by: ['company'],
        where: { hidden: false },
        _count: { company: true },
        orderBy: { _count: { company: 'desc' } },
        take: 10
      }),
      
      // Jobs by source
      prisma.job.groupBy({
        by: ['source'],
        where: { hidden: false },
        _count: { source: true },
        orderBy: { _count: { source: 'desc' } }
      }),
      
      // Score distribution
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN score >= 80 THEN 'Excellent (80-100)'
            WHEN score >= 60 THEN 'Good (60-79)'
            WHEN score >= 40 THEN 'Fair (40-59)'
            WHEN score >= 20 THEN 'Poor (20-39)'
            ELSE 'Very Poor (0-19)'
          END as score_range,
          COUNT(*) as count
        FROM job 
        WHERE hidden = false
        GROUP BY score_range
        ORDER BY MIN(score) DESC
      ` as Array<{ score_range: string; count: bigint }>
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalJobs,
          remoteJobs,
          recentJobs,
          remotePercentage: totalJobs > 0 ? Math.round((remoteJobs / totalJobs) * 100) : 0
        },
        topCompanies: topCompanies.map((company: any) => ({
          name: company.company,
          jobCount: company._count.company
        })),
        sourceBreakdown: topSources.map((source: any) => ({
          name: source.source,
          jobCount: source._count.source
        })),
        scoreDistribution: scoreDistribution.map(item => ({
          range: item.score_range,
          count: Number(item.count)
        }))
      }
    })

  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch job statistics'
    }, { status: 500 })
  }
}