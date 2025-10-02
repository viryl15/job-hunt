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