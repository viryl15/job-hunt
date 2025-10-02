// Comprehensive logging system for HelloWork automation
import fs from 'fs'
import path from 'path'

export interface AutomationLog {
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error' | 'debug'
  action: string
  details?: any
  screenshot?: string
  jobId?: string
  configId?: string
}

export class AutomationLogger {
  private logs: AutomationLog[] = []
  private configId: string
  private logDir: string

  constructor(configId: string) {
    this.configId = configId
    this.logDir = path.join(process.cwd(), 'automation-logs')
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19)
  }

  private getLogColor(level: string): string {
    switch (level) {
      case 'success': return '\x1b[32m' // Green
      case 'error': return '\x1b[31m'   // Red
      case 'warning': return '\x1b[33m' // Yellow
      case 'info': return '\x1b[36m'    // Cyan
      case 'debug': return '\x1b[37m'   // White
      default: return '\x1b[0m'         // Reset
    }
  }

  log(level: AutomationLog['level'], action: string, details?: any, jobId?: string): void {
    const logEntry: AutomationLog = {
      timestamp: new Date(),
      level,
      action,
      details,
      jobId,
      configId: this.configId
    }

    this.logs.push(logEntry)

    // Console output with colors
    const color = this.getLogColor(level)
    const reset = '\x1b[0m'
    const timestamp = this.formatTimestamp(logEntry.timestamp)
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${action}${reset}`)
    
    if (details && process.env.VERBOSE_LOGGING === 'true') {
      console.log(`${color}  Details:${reset}`, details)
    }

    // Write to file immediately for real-time monitoring
    this.writeToFile(logEntry)
  }

  success(action: string, details?: any, jobId?: string): void {
    this.log('success', `✅ ${action}`, details, jobId)
  }

  error(action: string, details?: any, jobId?: string): void {
    this.log('error', `❌ ${action}`, details, jobId)
  }

  warning(action: string, details?: any, jobId?: string): void {
    this.log('warning', `⚠️ ${action}`, details, jobId)
  }

  info(action: string, details?: any, jobId?: string): void {
    this.log('info', `ℹ️ ${action}`, details, jobId)
  }

  debug(action: string, details?: any, jobId?: string): void {
    if (process.env.VERBOSE_LOGGING === 'true') {
      this.log('debug', `🔍 ${action}`, details, jobId)
    }
  }

  addScreenshot(screenshotPath: string, action: string): void {
    const lastLog = this.logs[this.logs.length - 1]
    if (lastLog) {
      lastLog.screenshot = screenshotPath
      this.info(`Screenshot saved: ${screenshotPath}`, { action })
    }
  }

  private writeToFile(logEntry: AutomationLog): void {
    const logFile = path.join(this.logDir, `automation-${this.configId}-${new Date().toISOString().split('T')[0]}.log`)
    const logLine = `[${this.formatTimestamp(logEntry.timestamp)}] ${logEntry.level.toUpperCase()}: ${logEntry.action}\n`
    
    if (logEntry.details) {
      const detailsLine = `  Details: ${JSON.stringify(logEntry.details, null, 2)}\n`
      fs.appendFileSync(logFile, logLine + detailsLine)
    } else {
      fs.appendFileSync(logFile, logLine)
    }
  }

  exportLogs(): AutomationLog[] {
    return [...this.logs]
  }

  getLogSummary(): {
    total: number
    success: number
    errors: number
    warnings: number
    lastAction: string
    duration: number
  } {
    const total = this.logs.length
    const success = this.logs.filter(log => log.level === 'success').length
    const errors = this.logs.filter(log => log.level === 'error').length
    const warnings = this.logs.filter(log => log.level === 'warning').length
    const lastAction = this.logs[this.logs.length - 1]?.action || 'None'
    
    const firstLog = this.logs[0]
    const lastLog = this.logs[this.logs.length - 1]
    const duration = firstLog && lastLog ? 
      (lastLog.timestamp.getTime() - firstLog.timestamp.getTime()) / 1000 : 0

    return { total, success, errors, warnings, lastAction, duration }
  }

  saveSessionReport(): string {
    const summary = this.getLogSummary()
    const reportFile = path.join(this.logDir, `session-report-${this.configId}-${Date.now()}.json`)
    
    const report = {
      configId: this.configId,
      sessionStart: this.logs[0]?.timestamp,
      sessionEnd: this.logs[this.logs.length - 1]?.timestamp,
      summary,
      logs: this.logs
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    this.success(`Session report saved: ${reportFile}`)
    
    return reportFile
  }
}

// Human-like delay utilities
export class HumanDelays {
  // Random delay between min and max milliseconds
  static randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Typing delay - simulates human typing speed
  static typingDelay(textLength: number): number {
    // Average typing: 40-80 WPM = 200-400ms per character
    const baseDelay = textLength * this.randomDelay(50, 150)
    return Math.min(baseDelay, 3000) // Cap at 3 seconds
  }

  // Reading delay - simulates time to read page content
  static readingDelay(contentLength: number): number {
    // Average reading: 200-300 WPM = ~5 characters per second
    const words = Math.ceil(contentLength / 5)
    const readingTime = (words / 250) * 60 * 1000 // 250 WPM in ms
    return Math.min(Math.max(readingTime, 1000), 10000) // 1-10 seconds
  }

  // Page load delay - simulates waiting for page to fully load
  static pageLoadDelay(): number {
    return this.randomDelay(2000, 5000) // 2-5 seconds
  }

  // Form interaction delay - simulates thinking before filling forms
  static formInteractionDelay(): number {
    return this.randomDelay(1000, 3000) // 1-3 seconds
  }

  // Navigation delay - simulates time to find and click elements
  static navigationDelay(): number {
    return this.randomDelay(500, 2000) // 0.5-2 seconds
  }
}

// Enhanced sleep function with logging and optional mouse movements
export async function humanSleep(ms: number, action?: string, logger?: AutomationLogger): Promise<void> {
  if (logger && action) {
    logger.debug(`Waiting ${ms}ms for: ${action}`)
  }
  
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Enhanced sleep with human-like mouse movements for browser automation
export async function humanSleepWithMouse(page: any, ms: number, action?: string, logger?: AutomationLogger): Promise<void> {
  if (logger && action) {
    logger.debug(`Waiting ${ms}ms with mouse movement for: ${action}`)
  }
  
  // Calculate how many mouse movements to make during the wait
  const movementCount = Math.max(1, Math.floor(ms / 800)) // Movement every ~800ms
  const delayBetweenMovements = ms / movementCount
  
  for (let i = 0; i < movementCount; i++) {
    // Generate random mouse position within viewport
    const viewport = page.viewport()
    const x = Math.random() * (viewport?.width || 1366)
    const y = Math.random() * (viewport?.height || 768)
    
    try {
      // Move mouse smoothly to random position
      await page.mouse.move(x, y, { steps: HumanDelays.randomDelay(5, 15) })
      
      // Wait before next movement
      await new Promise(resolve => setTimeout(resolve, delayBetweenMovements))
    } catch (error) {
      // If mouse movement fails, just wait normally
      await new Promise(resolve => setTimeout(resolve, delayBetweenMovements))
    }
  }
}

// Mouse movement utilities
export class MouseMovements {
  // Simulate natural mouse jitter/micro-movements
  static async addMouseJitter(page: any, logger?: AutomationLogger): Promise<void> {
    try {
      const currentPosition = await page.evaluate(() => ({ x: 0, y: 0 })) // Fallback position
      const jitterX = currentPosition.x + HumanDelays.randomDelay(-10, 10)
      const jitterY = currentPosition.y + HumanDelays.randomDelay(-10, 10)
      
      await page.mouse.move(jitterX, jitterY, { steps: 2 })
      logger?.debug('Added mouse jitter')
    } catch (error) {
      // Ignore mouse jitter errors
    }
  }
  
  // Move mouse to element before clicking (more human-like)
  static async moveToElement(page: any, selector: string, logger?: AutomationLogger): Promise<void> {
    try {
      const element = await page.$(selector)
      if (element) {
        const box = await element.boundingBox()
        if (box) {
          // Move to center of element with some randomness
          const x = box.x + box.width / 2 + HumanDelays.randomDelay(-5, 5)
          const y = box.y + box.height / 2 + HumanDelays.randomDelay(-5, 5)
          
          await page.mouse.move(x, y, { steps: HumanDelays.randomDelay(8, 20) })
          logger?.debug(`Mouse moved to element: ${selector}`)
          
          // Small pause before clicking
          await humanSleep(HumanDelays.randomDelay(100, 300))
        }
      }
    } catch (error) {
      logger?.warning('Could not move mouse to element', { selector })
    }
  }
  
  // Simulate reading behavior with mouse movements
  static async simulateReading(page: any, duration: number, logger?: AutomationLogger): Promise<void> {
    const readingMovements = Math.floor(duration / 1500) // Movement every 1.5 seconds while reading
    
    for (let i = 0; i < readingMovements; i++) {
      // Simulate reading pattern - left to right, top to bottom
      const viewport = page.viewport()
      const startX = (viewport?.width || 1366) * 0.1 // 10% from left
      const endX = (viewport?.width || 1366) * 0.9 // 90% from left
      const y = (viewport?.height || 768) * (0.2 + (i * 0.1)) // Moving down the page
      
      try {
        // Move across like reading a line
        await page.mouse.move(startX, y, { steps: 10 })
        await humanSleep(500)
        await page.mouse.move(endX, y, { steps: 15 })
        await humanSleep(1000)
      } catch (error) {
        await humanSleep(1500) // Fallback delay
      }
    }
    
    logger?.debug('Completed reading simulation with mouse movements')
  }
}