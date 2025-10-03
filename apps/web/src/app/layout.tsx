import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { SessionProvider } from "@/components/session-provider";
import { UserInitializer } from "@/components/user-initializer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Job Hunt PWA",
  description: "Privacy-conscious PWA for EU developer job hunting",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <UserInitializer />
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
                  🏠 Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  ⚙️ Profile
                </Link>
                <Link 
                  href="/jobs" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  💼 Jobs
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
          <main>
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
