import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] })

// Metadata for the application
export const metadata: Metadata = {
  title: 'Lightweight Web Analytics',
  description: 'Privacy-focused, self-hosted web analytics solution',
  keywords: ['web analytics', 'privacy', 'self-hosted', 'next.js'],
  authors: [{ name: 'Lightweight Web Analytics' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow' // Since this is an analytics dashboard, we don't want it indexed
}

// Enable Edge Runtime for better performance
export const runtime = 'edge'

// Root layout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current environment
  const isProduction = process.env.NODE_ENV === 'production'
  const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_URL || ''

  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Include analytics script in production */}
        {isProduction && analyticsUrl && (
          <script async src={`${analyticsUrl}/analytics.js`} />
        )}
      </head>
      <body className="min-h-screen bg-gray-50">
        <div className="flex flex-col min-h-screen">
          {/* Main content */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer */}
          <footer className="mt-auto py-6 bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                Lightweight Web Analytics - A privacy-focused, self-hosted analytics solution
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}