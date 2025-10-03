'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function UserInitializer() {
  const { data: session, status } = useSession()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !initialized) {
      // Create or update user in database
      fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('✅ User initialized:', data.user)
          setInitialized(true)
        } else {
          console.error('❌ Failed to initialize user:', data.error)
        }
      })
      .catch(error => {
        console.error('❌ User initialization error:', error)
      })
    }
  }, [session, status, initialized])

  // This component doesn't render anything
  return null
}