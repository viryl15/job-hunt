import { NextRequest, NextResponse } from 'next/server'
import { addSkillMatchThresholdToConfigs } from '@/lib/migrations/add-skill-match-threshold'

/**
 * API endpoint to run database migration for adding skillMatchThreshold
 * 
 * Usage: POST /api/migrations/skill-match-threshold
 * 
 * This is safe to run multiple times - it only updates configs that don't have the field yet.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await addSkillMatchThresholdToConfigs()
    
    return NextResponse.json({
      success: true,
      message: `Migration complete! Updated ${result.updated} configurations`,
      data: result
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      },
      { status: 500 }
    )
  }
}
