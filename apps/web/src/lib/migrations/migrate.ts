/**
 * Database Migration Runner
 * Executes SQL migration files in order to set up or update the database schema
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { query } from '../database'

interface Migration {
  name: string
  filename: string
  sql: string
}

/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles(): Migration[] {
  const migrationsDir = join(__dirname)
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort() // Sort alphabetically to ensure correct order (001_, 002_, etc.)
  
  return files.map(filename => {
    const sql = readFileSync(join(migrationsDir, filename), 'utf-8')
    const name = filename.replace('.sql', '')
    return { name, filename, sql }
  })
}

/**
 * Check if a migration has already been executed
 */
async function hasMigrationRun(name: string): Promise<boolean> {
  try {
    const result = await query<any>(
      'SELECT * FROM migrations WHERE name = ?',
      [name]
    )
    return result.length > 0
  } catch {
    // If migrations table doesn't exist, no migrations have run
    return false
  }
}

/**
 * Execute a migration
 */
async function executeMigration(migration: Migration): Promise<void> {
  console.log(`\n📝 Executing migration: ${migration.name}`)
  
  // Split SQL by semicolons and execute each statement
  const statements = migration.sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (statement.trim().length === 0) continue
    
    try {
      await query(statement)
    } catch (error) {
      console.error(`❌ Error executing statement:`, error)
      throw error
    }
  }
  
  console.log(`✅ Migration ${migration.name} completed successfully`)
}

/**
 * Run all pending migrations
 */
async function runMigrations(force: boolean = false): Promise<void> {
  console.log('🚀 Starting database migration process...\n')
  console.log('=' .repeat(60))
  
  const migrations = getMigrationFiles()
  console.log(`\n📋 Found ${migrations.length} migration file(s)\n`)
  
  let executedCount = 0
  let skippedCount = 0
  
  for (const migration of migrations) {
    const hasRun = await hasMigrationRun(migration.name)
    
    if (hasRun && !force) {
      console.log(`⏭️  Skipping ${migration.name} (already executed)`)
      skippedCount++
      continue
    }
    
    if (hasRun && force) {
      console.log(`🔄 Re-executing ${migration.name} (force mode)`)
    }
    
    await executeMigration(migration)
    executedCount++
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Executed: ${executedCount} migration(s)`)
  console.log(`   ⏭️  Skipped: ${skippedCount} migration(s)`)
  console.log(`   📁 Total: ${migrations.length} migration(s)`)
  console.log('\n✅ Database migration completed successfully!\n')
}

/**
 * Show migration status
 */
async function showMigrationStatus(): Promise<void> {
  console.log('📊 Migration Status\n')
  console.log('=' .repeat(60))
  
  const migrations = getMigrationFiles()
  
  for (const migration of migrations) {
    const hasRun = await hasMigrationRun(migration.name)
    const status = hasRun ? '✅ Executed' : '⏳ Pending'
    console.log(`${status}  ${migration.name}`)
  }
  
  console.log('=' .repeat(60) + '\n')
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  try {
    if (command === 'status') {
      await showMigrationStatus()
    } else if (command === 'force') {
      await runMigrations(true)
    } else {
      await runMigrations(false)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { runMigrations, showMigrationStatus }
