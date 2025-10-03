import Link from 'next/link'

export default function ProfileNavigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center space-x-8">
          <Link href="/" className="text-xl font-bold">
            🎯 JobHunt
          </Link>
          
          <div className="flex space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              🏠 Tableau de Bord
            </Link>
            <Link 
              href="/profile" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              ⚙️ Profil
            </Link>
            <Link 
              href="/jobs" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              💼 Emplois
            </Link>
            <Link 
              href="/automation" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              🤖 Automation
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}