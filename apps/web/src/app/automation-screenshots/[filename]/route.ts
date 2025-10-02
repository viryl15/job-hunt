import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    // Security: Only allow image files
    if (!filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return new NextResponse('Invalid file type', { status: 400 })
    }
    
    const screenshotsDir = path.join(process.cwd(), 'automation-screenshots')
    const filePath = path.join(screenshotsDir, filename)
    
    // Security: Ensure file is within screenshots directory
    const normalizedPath = path.normalize(filePath)
    if (!normalizedPath.startsWith(screenshotsDir)) {
      return new NextResponse('Invalid file path', { status: 400 })
    }
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }
    
    const fileBuffer = fs.readFileSync(filePath)
    const ext = path.extname(filename).toLowerCase()
    
    let contentType = 'image/png'
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    })
    
  } catch (error) {
    console.error('Error serving screenshot:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}