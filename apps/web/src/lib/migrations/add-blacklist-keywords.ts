/**
 * Migration script to add blacklistKeywords to existing job board configs
 * This script updates all existing configurations to include an empty blacklistKeywords array
 */

import { query } from '../database'

async function addBlacklistKeywordsToConfigs() {
  console.log('🔄 Starting migration: Add blacklistKeywords to job board configs...\n')

  try {
    // Get all job board configs
    const configs = await query<any>(
      'SELECT id, applicationSettings FROM job_board_config'
    )

    console.log(`📊 Found ${configs.length} job board configurations\n`)

    let updatedCount = 0
    let skippedCount = 0

    for (const config of configs) {
      const applicationSettings = JSON.parse(config.applicationSettings)
      
      // Check if blacklistKeywords already exists
      if (applicationSettings.blacklistKeywords !== undefined) {
        console.log(`⏭️  Config ${config.id}: Already has blacklistKeywords field, skipping`)
        skippedCount++
        continue
      }

      // Add blacklistKeywords field with empty array
      applicationSettings.blacklistKeywords = []

      // Update the config in database
      await query(
        'UPDATE job_board_config SET applicationSettings = ? WHERE id = ?',
        [JSON.stringify(applicationSettings), config.id]
      )

      console.log(`✅ Config ${config.id}: Added blacklistKeywords field`)
      updatedCount++
    }

    console.log(`\n📈 Migration Summary:`)
    console.log(`   ✅ Updated: ${updatedCount} configs`)
    console.log(`   ⏭️  Skipped: ${skippedCount} configs (already had field)`)
    console.log(`   📊 Total: ${configs.length} configs\n`)
    console.log('✅ Migration completed successfully!\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
addBlacklistKeywordsToConfigs()
