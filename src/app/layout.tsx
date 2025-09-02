import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Employee Time Tracker',
  description: 'Track employee hours and generate weekly reports',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
  },
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Employee Time Tracker',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
  <body className="antialiased bg-gray-50" suppressHydrationWarning={true}>
        <div className="safe-area min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
