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

// Simple database operations for jobs
export const db = {
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
    const params: any[] = []

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
  }
}

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}