/**
 * Migration: Add skillMatchThreshold to existing job_board_config records
 * 
 * This migration updates all existing job board configurations to include
 * the new skillMatchThreshold field (default: 60%) in their applicationSettings JSON.
 * 
 * Run this once to migrate existing data.
 */

import { query } from '../database'

export async function addSkillMatchThresholdToConfigs() {
  console.log('🔄 Starting migration: Add skillMatchThreshold to job_board_config...')
  
  try {
    // Get all job board configs
    const configs = await query('SELECT id, applicationSettings FROM job_board_config')
    
    console.log(`📊 Found ${configs.length} configurations to migrate`)
    
    let updated = 0
    
    for (const config of configs) {
      const settings = JSON.parse(config.applicationSettings)
      
      // Only update if skillMatchThreshold doesn't exist
      if (settings.skillMatchThreshold === undefined) {
        settings.skillMatchThreshold = 60 // Default to 60%
        
        await query(
          'UPDATE job_board_config SET applicationSettings = ?, updatedAt = NOW() WHERE id = ?',
          [JSON.stringify(settings), config.id]
        )
        
        updated++
      }
    }
    
    console.log(`✅ Migration complete! Updated ${updated} configurations`)
    console.log(`ℹ️  Skipped ${configs.length - updated} configurations (already had skillMatchThreshold)`)
    
    return {
      success: true,
      total: configs.length,
      updated,
      skipped: configs.length - updated
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Allow running this script directly
if (require.main === module) {
  addSkillMatchThresholdToConfigs()
    .then(() => {
      console.log('✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error:', error)
      process.exit(1)
    })
}
