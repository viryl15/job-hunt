import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export function withAuth(handler: (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse>) {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    return handler(req, context)
  }
}

export function withCronAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const cronSecret = req.headers.get("authorization")
    
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    return handler(req)
  }
}