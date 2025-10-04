import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status } = await request.json()
    const applicationId = params.id

    // Validate status
    const validStatuses = ['LEAD', 'APPLIED', 'FAILED', 'SCREEN', 'TECH', 'ONSITE', 'OFFER', 'HIRED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Update the application status
    await query(
      'UPDATE application SET status = ?, updatedAt = NOW() WHERE id = ?',
      [status, applicationId]
    )

    console.log(`[Update Status API] Updated application ${applicationId} to status ${status}`)

    return NextResponse.json({
      success: true,
      data: { id: applicationId, status }
    })

  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update application status' },
      { status: 500 }
    )
  }
}
