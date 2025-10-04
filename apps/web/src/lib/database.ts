import mysql from 'mysql2/promise'

// Simple database connection
let connection: mysql.Connection | null = null

async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'jobhunt',
      port: 3306
    })
  }
  return connection
}

// Simple query helper
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const conn = await getConnection()
  const [rows] = await conn.execute(sql, params)
  return rows as T[]
}

// User management
export const db = {
  // User operations
  async createUser(userData: {
    id: string
    email: string
    name?: string
    image?: string
    provider: string
    providerId: string
  }) {
    await query(`
      INSERT INTO users (
        id, email, name, image, provider, providerId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      userData.id,
      userData.email,
      userData.name || null,
      userData.image || null,
      userData.provider,
      userData.providerId
    ])
    return userData.id
  },

  async getUserByEmail(email: string) {
    const users = await query(`
      SELECT * FROM users WHERE email = ? LIMIT 1
    `, [email])
    return users[0] || null
  },

  async getUserById(id: string) {
    const users = await query(`
      SELECT * FROM users WHERE id = ? LIMIT 1
    `, [id])
    return users[0] || null
  },

  async updateUser(id: string, updates: {
    name?: string
    image?: string
    phone?: string
    lastLoginAt?: Date
  }) {
    const setClause = []
    const params: any[] = []
    
    if (updates.name !== undefined) {
      setClause.push('name = ?')
      params.push(updates.name)
    }
    if (updates.image !== undefined) {
      setClause.push('image = ?')
      params.push(updates.image)
    }
    if (updates.phone !== undefined) {
      setClause.push('phone = ?')
      params.push(updates.phone)
    }
    if (updates.lastLoginAt !== undefined) {
      setClause.push('lastLoginAt = ?')
      params.push(updates.lastLoginAt)
    }
    
    setClause.push('updatedAt = NOW()')
    params.push(id)
    
    await query(`
      UPDATE users SET ${setClause.join(', ')} WHERE id = ?
    `, params)
  },

  // Job operations
  async createJob(jobData: {
    source: string
    sourceId?: string
    title: string
    company: string
    locations: string[]
    remote: boolean
    url: string
    description?: string
    salaryMin?: number
    salaryMax?: number
    currency?: string
    tags: string[]
    postedAt?: Date
    score: number
  }) {
    const id = generateId()
    await query(`
      INSERT INTO job (
        id, source, sourceId, title, company, locations, remote, url, 
        description, salaryMin, salaryMax, currency, tags, postedAt, score, hidden, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      id,
      jobData.source,
      jobData.sourceId || null,
      jobData.title,
      jobData.company,
      JSON.stringify(jobData.locations),
      jobData.remote ? 1 : 0,
      jobData.url,
      jobData.description || null,
      jobData.salaryMin || null,
      jobData.salaryMax || null,
      jobData.currency || null,
      JSON.stringify(jobData.tags),
      jobData.postedAt || null,
      jobData.score,
      0 // hidden = false
    ])
    return id
  },

  async findJobByUrl(url: string) {
    const results = await query('SELECT * FROM job WHERE url = ?', [url])
    return results[0] || null
  },

  async countJobs() {
    const results = await query('SELECT COUNT(*) as count FROM job WHERE hidden = 0')
    return Number(results[0]?.count || 0)
  },

  async getJobs(options: {
    limit?: number
    offset?: number
    source?: string
    remote?: boolean
    search?: string
    minScore?: number
    orderBy?: string
    order?: 'ASC' | 'DESC'
  } = {}) {
    let sql = 'SELECT * FROM job WHERE hidden = 0'
    const params: (string | number)[] = []

    if (options.source) {
      sql += ' AND source = ?'
      params.push(options.source)
    }

    if (options.remote !== undefined) {
      sql += ' AND remote = ?'
      params.push(options.remote ? 1 : 0)
    }

    if (options.search) {
      sql += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)'
      const searchTerm = `%${options.search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (options.minScore) {
      sql += ' AND score >= ?'
      params.push(options.minScore)
    }

    // Validate orderBy to prevent SQL injection
    const validOrderBy = ['score', 'createdAt', 'postedAt', 'title', 'company']
    const orderBy = validOrderBy.includes(options.orderBy || '') ? options.orderBy : 'score'
    const order = options.order === 'ASC' ? 'ASC' : 'DESC'
    sql += ` ORDER BY ${orderBy} ${order}`

    // Use string concatenation for LIMIT to avoid parameter binding issues
    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit.toString())}`
      
      if (options.offset) {
        sql += ` OFFSET ${parseInt(options.offset.toString())}`
      }
    }

    return await query(sql, params)
  },

  // Job board configuration operations
  async createJobBoardConfig(config: Omit<JobBoardConfig, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = generateId()
    await query(`
      INSERT INTO job_board_config (
        id, userId, boardName, boardUrl, credentials, preferences, 
        applicationSettings, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      id,
      config.userId,
      config.boardName,
      config.boardUrl,
      JSON.stringify(config.credentials),
      JSON.stringify(config.preferences),
      JSON.stringify(config.applicationSettings),
      config.isActive ? 1 : 0
    ])
    return id
  },

  async getJobBoardConfigs(userId: string): Promise<JobBoardConfig[]> {
    const configs = await query(`
      SELECT * FROM job_board_config WHERE userId = ? ORDER BY createdAt DESC
    `, [userId])
    
    return configs.map((config: any) => {
      const applicationSettings = JSON.parse(config.applicationSettings)
      // Set default skill match threshold if not present
      if (applicationSettings.skillMatchThreshold === undefined) {
        applicationSettings.skillMatchThreshold = 60
      }
      
      return {
        ...config,
        credentials: JSON.parse(config.credentials),
        preferences: JSON.parse(config.preferences),
        applicationSettings,
        isActive: Boolean(config.isActive)
      }
    })
  },

  async getJobBoardConfig(id: string): Promise<JobBoardConfig | null> {
    const configs = await query(`
      SELECT * FROM job_board_config WHERE id = ? LIMIT 1
    `, [id])
    
    if (configs.length === 0) return null
    
    const config = configs[0] as any
    const applicationSettings = JSON.parse(config.applicationSettings)
    // Set default skill match threshold if not present
    if (applicationSettings.skillMatchThreshold === undefined) {
      applicationSettings.skillMatchThreshold = 60
    }
    
    return {
      ...config,
      credentials: JSON.parse(config.credentials),
      preferences: JSON.parse(config.preferences),
      applicationSettings,
      isActive: Boolean(config.isActive)
    }
  },

  async saveJobBoardConfig(config: JobBoardConfig): Promise<void> {
    // Check if config exists
    const existing = await db.getJobBoardConfig(config.id)
    
    if (existing) {
      // Update existing config
      await query(`
        UPDATE job_board_config SET 
          boardName = ?, boardUrl = ?, credentials = ?, preferences = ?, 
          applicationSettings = ?, isActive = ?, updatedAt = NOW()
        WHERE id = ?
      `, [
        config.boardName,
        config.boardUrl,
        JSON.stringify(config.credentials),
        JSON.stringify(config.preferences),
        JSON.stringify(config.applicationSettings),
        config.isActive,
        config.id
      ])
    } else {
      // Insert new config
      await query(`
        INSERT INTO job_board_config (
          id, userId, boardName, boardUrl, credentials, preferences, 
          applicationSettings, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        config.id,
        config.userId,
        config.boardName,
        config.boardUrl,
        JSON.stringify(config.credentials),
        JSON.stringify(config.preferences),
        JSON.stringify(config.applicationSettings),
        config.isActive
      ])
    }
  },

  async updateJobBoardConfig(id: string, updates: Partial<JobBoardConfig>) {
    const setClause = []
    const params: (string | number)[] = []
    
    if (updates.credentials) {
      setClause.push('credentials = ?')
      params.push(JSON.stringify(updates.credentials))
    }
    if (updates.preferences) {
      setClause.push('preferences = ?')
      params.push(JSON.stringify(updates.preferences))
    }
    if (updates.applicationSettings) {
      setClause.push('applicationSettings = ?')
      params.push(JSON.stringify(updates.applicationSettings))
    }
    if (updates.isActive !== undefined) {
      setClause.push('isActive = ?')
      params.push(updates.isActive ? 1 : 0)
    }
    
    setClause.push('updatedAt = NOW()')
    params.push(id)
    
    await query(`
      UPDATE job_board_config SET ${setClause.join(', ')} WHERE id = ?
    `, params)
  },

  // Application logging
  async logApplication(data: Omit<ApplicationLog, 'id' | 'createdAt'>) {
    const id = generateId()
    await query(`
      INSERT INTO application_log (
        id, jobId, jobBoardConfigId, status, appliedAt, response, 
        followUpRequired, followUpDate, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      id,
      data.jobId,
      data.jobBoardConfigId,
      data.status,
      data.appliedAt || null,
      data.response || null,
      data.followUpRequired ? 1 : 0,
      data.followUpDate || null,
      data.notes || null
    ])
    return id
  },

  async getApplicationLogs(jobBoardConfigId?: string): Promise<ApplicationLog[]> {
    let sql = 'SELECT * FROM application_log'
    const params: string[] = []
    
    if (jobBoardConfigId) {
      sql += ' WHERE jobBoardConfigId = ?'
      params.push(jobBoardConfigId)
    }
    
    sql += ' ORDER BY createdAt DESC'
    
    const logs = await query(sql, params)
    return logs.map((log: any) => ({
      ...log,
      followUpRequired: Boolean(log.followUpRequired)
    }))
  },

  async getUserApplications(userId: string): Promise<ApplicationLog[]> {
    const sql = `
      SELECT al.*, j.title as jobTitle, j.company, j.url as jobUrl, j.locations, j.salaryMin, j.salaryMax, j.currency
      FROM application_log al 
      LEFT JOIN job j ON al.jobId = j.id
      WHERE al.jobBoardConfigId LIKE ?
      ORDER BY al.createdAt DESC
    `
    const logs = await query(sql, [`config_${userId}`])
    return logs.map((log: any) => ({
      ...log,
      followUpRequired: Boolean(log.followUpRequired),
      appliedAt: log.appliedAt || log.createdAt
    }))
  },

  // Job operations
  async createOrUpdateJob(jobData: {
    id?: string
    source: string
    sourceId?: string
    title: string
    company: string
    locations: string[]
    remote?: boolean
    url: string
    description?: string
    salaryMin?: number
    salaryMax?: number
    currency?: string
    tags?: string[]
    postedAt?: Date
  }): Promise<string> {
    const id = jobData.id || generateId()
    
    // Check if job with this URL already exists
    const existing = await query('SELECT id FROM job WHERE url = ?', [jobData.url])
    
    if (existing.length > 0) {
      // Update existing job
      await query(`
        UPDATE job SET
          title = ?,
          company = ?,
          locations = ?,
          remote = ?,
          description = ?,
          salaryMin = ?,
          salaryMax = ?,
          currency = ?,
          tags = ?,
          postedAt = ?,
          updatedAt = NOW()
        WHERE url = ?
      `, [
        jobData.title,
        jobData.company,
        JSON.stringify(jobData.locations),
        jobData.remote ? 1 : 0,
        jobData.description || null,
        jobData.salaryMin || null,
        jobData.salaryMax || null,
        jobData.currency || null,
        JSON.stringify(jobData.tags || []),
        jobData.postedAt || null,
        jobData.url
      ])
      return existing[0].id
    } else {
      // Create new job
      await query(`
        INSERT INTO job (
          id, source, sourceId, title, company, locations, remote, url,
          description, salaryMin, salaryMax, currency, tags, postedAt,
          createdAt, updatedAt, score, hidden
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, 0)
      `, [
        id,
        jobData.source,
        jobData.sourceId || null,
        jobData.title,
        jobData.company,
        JSON.stringify(jobData.locations),
        jobData.remote ? 1 : 0,
        jobData.url,
        jobData.description || null,
        jobData.salaryMin || null,
        jobData.salaryMax || null,
        jobData.currency || null,
        JSON.stringify(jobData.tags || []),
        jobData.postedAt || null
      ])
      return id
    }
  },

  // Application operations (using the main `application` table)
  async createApplication(appData: {
    jobId: string
    userId: string
    status?: 'LEAD' | 'APPLIED' | 'SCREEN' | 'TECH' | 'ONSITE' | 'OFFER' | 'HIRED' | 'REJECTED' | 'FAILED'
    channel?: 'EMAIL' | 'FORM' | 'REFERRAL'
    resumePath?: string
    coverText?: string
    notes?: string
    contactEmail?: string
  }): Promise<string> {
    const id = generateId()
    
    await query(`
      INSERT INTO application (
        id, jobId, userId, status, channel, resumePath, coverText,
        notes, contactEmail, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      id,
      appData.jobId,
      appData.userId,
      appData.status || 'APPLIED',
      appData.channel || 'FORM',
      appData.resumePath || null,
      appData.coverText || null,
      appData.notes || null,
      appData.contactEmail || null
    ])
    
    return id
  },

  async getUserApplicationsFromMainTable(userId: string): Promise<Application[]> {
    const sql = `
      SELECT 
        a.*,
        j.title,
        j.company,
        j.url,
        j.locations,
        j.salaryMin,
        j.salaryMax,
        j.currency,
        j.description,
        j.remote,
        j.tags,
        j.postedAt
      FROM application a
      INNER JOIN job j ON a.jobId = j.id
      WHERE a.userId = ?
      ORDER BY a.createdAt DESC
    `
    const apps = await query<any>(sql, [userId])
    
    // MySQL2 automatically parses JSON columns to JavaScript objects
    return apps.map((app) => ({
      ...app,
      locations: Array.isArray(app.locations) ? app.locations : [],
      tags: Array.isArray(app.tags) ? app.tags : [],
      remote: Boolean(app.remote)
    }))
  }
}

// User management interfaces
export interface User {
  id: string
  email: string
  name?: string
  image?: string
  phone?: string
  city?: string
  postalCode?: string
  country?: string
  provider: string
  providerId: string
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Job board configuration for automated applications
export interface JobBoardConfig {
  id: string
  userId: string
  boardName: string
  boardUrl: string
  credentials: {
    username?: string
    email?: string
    password?: string // encrypted
    apiKey?: string
    phone?: string // Phone number for applications
    address?: string // Address for applications
  }
  preferences: {
    skills: string[]
    locations: string[]
    salaryMin?: number
    salaryMax?: number
    jobTypes: string[] // full-time, part-time, contract, etc.
    experienceLevel: string
    remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any'
  }
  applicationSettings: {
    autoApply: boolean
    maxApplicationsPerDay: number
    coverLetterTemplate?: string
    useCustomTemplate?: boolean
    resumeUrl?: string
    customMessage?: string
    skillMatchThreshold?: number // 0-100%, default 60%. Jobs with skill match below this % are skipped
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ApplicationLog {
  id: string
  jobId: string
  jobBoardConfigId: string
  status: 'pending' | 'applied' | 'failed' | 'rejected' | 'interview' | 'offer'
  appliedAt?: Date
  response?: string
  followUpRequired?: boolean
  followUpDate?: Date
  notes?: string
  createdAt: Date
}

export interface Application {
  id: string
  jobId: string
  userId: string
  status: 'LEAD' | 'APPLIED' | 'SCREEN' | 'TECH' | 'ONSITE' | 'OFFER' | 'HIRED' | 'REJECTED' | 'FAILED'
  channel: 'EMAIL' | 'FORM' | 'REFERRAL'
  resumePath?: string
  coverText?: string
  emailId?: string
  threadId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  followupAt?: Date
  contactEmail?: string
  // Joined job data
  title?: string
  company?: string
  url?: string
  locations?: string[]
  salaryMin?: number
  salaryMax?: number
  currency?: string
  description?: string
  remote?: boolean
  tags?: string[]
  postedAt?: Date
}

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}