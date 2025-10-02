import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const logsDir = path.join(process.cwd(), 'automation-logs')
    
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json({
        success: true,
        data: { configs: [] }
      })
    }

    const logFiles = fs.readdirSync(logsDir)
    
    // Extract unique config IDs from log filenames
    // Format: automation-{configId}-{date}.log
    const configIds = new Set<string>()
    const configDetails = new Map<string, { 
      id: string, 
      displayName: string, 
      lastActive: Date,
      logCount: number 
    }>()

    logFiles.forEach(file => {
      if (file.startsWith('automation-') && file.endsWith('.log')) {
        // Parse: automation-{configId}-{date}.log
        const parts = file.replace('automation-', '').replace('.log', '').split('-')
        
        if (parts.length >= 4) {
          // Join all parts except the last 3 (which are date: YYYY-MM-DD)
          const configId = parts.slice(0, -3).join('-')
          const dateStr = parts.slice(-3).join('-')
          
          configIds.add(configId)
          
          // Get file stats
          const filePath = path.join(logsDir, file)
          const stats = fs.statSync(filePath)
          
          if (!configDetails.has(configId) || stats.mtime > configDetails.get(configId)!.lastActive) {
            let displayName = configId
            
            // Create friendly display names
            if (configId === 'test-automation') {
              displayName = 'Test Automation'
            } else if (configId === 'hellowork') {
              displayName = 'HelloWork'
            } else if (configId.includes('hellowork') || configId.length > 10) {
              displayName = `HelloWork Real (${configId.substring(0, 8)}...)`
            }
            
            configDetails.set(configId, {
              id: configId,
              displayName,
              lastActive: stats.mtime,
              logCount: (configDetails.get(configId)?.logCount || 0) + 1
            })
          }
        }
      }
    })

    // Convert to array and sort by last active
    const configs = Array.from(configDetails.values()).sort((a, b) => 
      b.lastActive.getTime() - a.lastActive.getTime()
    )

    return NextResponse.json({
      success: true,
      data: { configs }
    })

  } catch (error) {
    console.error('Failed to get log configurations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get configurations' 
      },
      { status: 500 }
    )
  }
}