/**
 * Database Setup Script
 * Quick command to set up the database from scratch
 * 
 * Usage:
 *   npm run db:setup           - Set up database with all migrations
 *   npm run db:setup -- --fresh - Drop all tables and recreate (DESTRUCTIVE!)
 *   npm run db:status          - Show migration status
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '../database'
import { runMigrations } from './migrate'

interface SetupOptions {
  fresh?: boolean
  seed?: boolean
}

/**
 * Drop all existing tables (DESTRUCTIVE!)
 */
async function dropAllTables(): Promise<void> {
  console.log('⚠️  Dropping all existing tables...\n')
  
  const tables = [
    'migrations',
    'application_log',
    'application',
    'job',
    'job_board_config',
    'verificationtoken',
    'session',
    'account',
    'user',
    'users'
  ]
  
  for (const table of tables) {
    try {
      await query(`DROP TABLE IF EXISTS \`${table}\``)
      console.log(`   🗑️  Dropped table: ${table}`)
    } catch (error) {
      console.log(`   ⚠️  Could not drop table ${table}:`, error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  console.log('\n✅ All tables dropped\n')
}

/**
 * Seed the database with sample data
 */
async function seedDatabase(): Promise<void> {
  console.log('\n🌱 Seeding database with sample data...\n')
  
  // You can add seed data here
  // For now, just log that seeding would happen
  console.log('   ℹ️  No seed data configured yet')
  console.log('   💡 Add seed data in src/lib/migrations/setup.ts\n')
}

/**
 * Setup database
 */
async function setupDatabase(options: SetupOptions = {}): Promise<void> {
  console.log('🚀 Job Hunt - Database Setup\n')
  console.log('=' .repeat(60))
  
  try {
    // Test database connection
    console.log('\n🔌 Testing database connection...')
    await query('SELECT 1')
    console.log('✅ Database connection successful\n')
    
    // Drop tables if fresh install
    if (options.fresh) {
      console.log('⚠️  FRESH INSTALL MODE - This will delete all data!\n')
      await new Promise(resolve => setTimeout(resolve, 2000)) // Give user time to cancel
      await dropAllTables()
    }
    
    // Run migrations
    console.log('📦 Running migrations...\n')
    await runMigrations()
    
    // Seed database if requested
    if (options.seed) {
      await seedDatabase()
    }
    
    console.log('=' .repeat(60))
    console.log('\n✅ Database setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Configure your job board settings')
    console.log('   2. Start the application: npm run dev')
    console.log('   3. Visit http://localhost:3000\n')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database setup failed:', error)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check your database credentials in .env or database.ts')
    console.error('   2. Ensure MySQL is running')
    console.error('   3. Verify the database "jobhunt" exists')
    console.error('   4. Check user permissions\n')
    process.exit(1)
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const options: SetupOptions = {
    fresh: args.includes('--fresh'),
    seed: args.includes('--seed')
  }
  
  if (options.fresh) {
    console.log('⚠️  WARNING: --fresh flag detected!')
    console.log('⚠️  This will DELETE ALL DATA in the database!')
    console.log('⚠️  Press Ctrl+C now to cancel, or wait 3 seconds to continue...\n')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  await setupDatabase(options)
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { setupDatabase }
