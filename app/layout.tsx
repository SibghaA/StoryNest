import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'StoryNest',
  description: 'Personalized bedtime stories for your little ones',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-amber-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
