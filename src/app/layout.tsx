import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'drunk30.buzz - Build Anyway',
    template: '%s | drunk30.buzz',
  },
  description:
    'Build anyway. Recover loudly. Ship consistently. A solo creator documenting the journey of building, learning, and recovery.',
  keywords: [
    'podcast',
    'youtube',
    'recovery',
    'sobriety',
    'building in public',
    'coding',
    'entrepreneurship',
  ],
  authors: [{ name: 'drunk30' }],
  creator: 'drunk30',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://drunk30.buzz',
    title: 'drunk30.buzz - Build Anyway',
    description:
      'Build anyway. Recover loudly. Ship consistently. A solo creator documenting the journey.',
    siteName: 'drunk30.buzz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'drunk30.buzz - Build Anyway',
    description: 'Build anyway. Recover loudly. Ship consistently.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Toaster />
      </body>
    </html>
  )
}
