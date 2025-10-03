import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')
    const logType = searchParams.get('type') || 'recent' // recent, session, all

    const logsDir = path.join(process.cwd(), 'automation-logs')
    
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json({
        success: true,
        data: { logs: [], message: 'No logs directory found' }
      })
    }

    let logs: string[] = []
    const logFiles = fs.readdirSync(logsDir)

    switch (logType) {
      case 'recent':
        // Get today's logs for the specific config
        const today = new Date().toISOString().split('T')[0]
        const recentLogFile = logFiles.find(file => 
          file.includes(`automation-${configId}-${today}`)
        )
        
        if (recentLogFile) {
          const logContent = fs.readFileSync(path.join(logsDir, recentLogFile), 'utf-8')
          logs = logContent.split('\n').filter(line => line.trim())
        }
        break

      case 'session':
        // Get latest session report
        const sessionFiles = logFiles
          .filter(file => file.includes(`session-report-${configId}`))
          .sort((a, b) => b.localeCompare(a)) // Latest first

        if (sessionFiles.length > 0) {
          const sessionContent = fs.readFileSync(
            path.join(logsDir, sessionFiles[0]), 
            'utf-8'
          )
          return NextResponse.json({
            success: true,
            data: { sessionReport: JSON.parse(sessionContent) }
          })
        }
        break

      case 'all':
        // Get all logs for the config
        const configLogs = logFiles.filter(file => 
          file.includes(`automation-${configId}`)
        )
        
        for (const logFile of configLogs.slice(0, 5)) { // Limit to 5 recent files
          const logContent = fs.readFileSync(path.join(logsDir, logFile), 'utf-8')
          logs.push(`\n=== ${logFile} ===`)
          logs.push(...logContent.split('\n').filter(line => line.trim()))
        }
        break
    }

    // Get screenshots if they exist
    const screenshotsDir = path.join(process.cwd(), 'automation-screenshots')
    let screenshots: string[] = []
    
    if (fs.existsSync(screenshotsDir)) {
      const screenshotFiles = fs.readdirSync(screenshotsDir)
        .filter(file => file.includes(configId || ''))
        .sort((a, b) => b.localeCompare(a)) // Latest first
        .slice(0, 10) // Last 10 screenshots
      
      screenshots = screenshotFiles.map(file => `/automation-screenshots/${file}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.slice(0, 500), // Limit log lines
        screenshots,
        logType,
        configId
      }
    })

  } catch (error) {
    console.error('Failed to fetch automation logs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch logs' 
      },
      { status: 500 }
    )
  }
}

// Get live logs (streaming)
export async function POST(request: NextRequest) {
  try {
    const { configId } = await request.json()
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      )
    }

    const logsDir = path.join(process.cwd(), 'automation-logs')
    const today = new Date().toISOString().split('T')[0]
    const logFile = path.join(logsDir, `automation-${configId}-${today}.log`)

    if (!fs.existsSync(logFile)) {
      return NextResponse.json({
        success: true,
        data: { logs: [], message: 'No current log file' }
      })
    }

    // Read the last N lines of the log file
    const logContent = fs.readFileSync(logFile, 'utf-8')
    const lines = logContent.split('\n').filter(line => line.trim())
    const recentLines = lines.slice(-50) // Last 50 lines

    return NextResponse.json({
      success: true,
      data: {
        logs: recentLines,
        timestamp: new Date().toISOString(),
        logFile: path.basename(logFile)
      }
    })

  } catch (error) {
    console.error('Failed to get live logs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get live logs' 
      },
      { status: 500 }
    )
  }
}

// Delete logs and screenshots
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'clear-logs', 'clear-screenshots', 'delete-screenshot'
    const configId = searchParams.get('configId')
    const screenshot = searchParams.get('screenshot')

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'clear-logs':
        // Clear all log files for a specific config
        if (!configId) {
          return NextResponse.json(
            { success: false, error: 'Config ID is required for clearing logs' },
            { status: 400 }
          )
        }

        const logsDir = path.join(process.cwd(), 'automation-logs')
        if (fs.existsSync(logsDir)) {
          const logFiles = fs.readdirSync(logsDir)
          const configLogs = logFiles.filter(file => 
            file.includes(`automation-${configId}`) || 
            file.includes(`session-report-${configId}`)
          )

          let deletedCount = 0
          for (const logFile of configLogs) {
            fs.unlinkSync(path.join(logsDir, logFile))
            deletedCount++
          }

          return NextResponse.json({
            success: true,
            message: `Deleted ${deletedCount} log file(s)`,
            data: { deletedCount }
          })
        }
        break

      case 'clear-screenshots':
        // Clear all screenshots for a specific config
        if (!configId) {
          return NextResponse.json(
            { success: false, error: 'Config ID is required for clearing screenshots' },
            { status: 400 }
          )
        }

        const screenshotsDir = path.join(process.cwd(), 'automation-screenshots')
        if (fs.existsSync(screenshotsDir)) {
          const screenshotFiles = fs.readdirSync(screenshotsDir)
          const configScreenshots = screenshotFiles.filter(file => 
            file.includes(configId)
          )

          let deletedCount = 0
          for (const screenshotFile of configScreenshots) {
            fs.unlinkSync(path.join(screenshotsDir, screenshotFile))
            deletedCount++
          }

          return NextResponse.json({
            success: true,
            message: `Deleted ${deletedCount} screenshot(s)`,
            data: { deletedCount }
          })
        }
        break

      case 'delete-screenshot':
        // Delete a specific screenshot
        if (!screenshot) {
          return NextResponse.json(
            { success: false, error: 'Screenshot filename is required' },
            { status: 400 }
          )
        }

        const screenshotPath = path.join(process.cwd(), 'automation-screenshots', path.basename(screenshot))
        if (fs.existsSync(screenshotPath)) {
          fs.unlinkSync(screenshotPath)
          return NextResponse.json({
            success: true,
            message: 'Screenshot deleted successfully'
          })
        } else {
          return NextResponse.json(
            { success: false, error: 'Screenshot not found' },
            { status: 404 }
          )
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: false,
      error: 'Directory not found'
    }, { status: 404 })

  } catch (error) {
    console.error('Failed to delete:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete' 
      },
      { status: 500 }
    )
  }
}