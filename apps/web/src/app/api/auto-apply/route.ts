import { NextRequest, NextResponse } from 'next/server'
import { runAutoApplyAutomation } from '@/lib/auto-apply-service'

export async function POST(request: NextRequest) {
  try {
    const { configId, useRealAutomation = false } = await request.json()
    
    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    // Create a Server-Sent Events stream
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        // Helper function to send progress updates
        const sendUpdate = (data: { type: string; data?: any; error?: string }) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          )
        }
        
        try {
          // Run automation with progress callback
          const result = await runAutoApplyAutomation(
            configId, 
            useRealAutomation,
            sendUpdate // Pass callback for real-time updates
          )
          
          // Send final completion message
          sendUpdate({
            type: 'complete',
            data: result
          })
          
          controller.close()
        } catch (error) {
          sendUpdate({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          controller.close()
        }
      }
    })
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Automation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
