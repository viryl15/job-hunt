import { NextRequest, NextResponse } from 'next/server'
import { JobBoardFactory, ApplicationTemplateEngine } from '@/lib/job-board-automation'
import type { SearchCriteria, ApplicationData, JobListing, AutoApplicationResult } from '@/lib/job-board-automation'

export async function POST(request: NextRequest) {
  try {
    // Test importing job-board-automation
    // Classes available: JobBoardFactory, ApplicationTemplateEngine
    // Types available: SearchCriteria, ApplicationData, JobListing, AutoApplicationResult
    
    return NextResponse.json({
      success: true,
      message: 'Job board automation import works',
      imports: {
        JobBoardFactory: !!JobBoardFactory,
        SearchCriteria: 'SearchCriteria imported',
        ApplicationData: 'ApplicationData imported',
        ApplicationTemplateEngine: !!ApplicationTemplateEngine,
        JobListing: 'JobListing imported',
        AutoApplicationResult: 'AutoApplicationResult imported'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: `Import error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}