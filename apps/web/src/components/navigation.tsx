'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings } from 'lucide-react'

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-background" suppressHydrationWarning>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              JobHunt
            </Link>
            
            <div className="flex space-x-6">
              <Link 
                href="/" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link 
                href="/profile" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Profile
              </Link>
              <Link 
                href="/jobs" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Jobs
              </Link>
              <Link 
                href="/automation" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Automation
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
            
            {status === 'unauthenticated' && (
              <Button asChild variant="default" size="sm">
                <Link href="/api/auth/signin">Sign In</Link>
              </Button>
            )}
            
            {status === 'authenticated' && session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{session.user.name || session.user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                      {session.user.id && (
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {session.user.id.substring(0, 12)}...
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
