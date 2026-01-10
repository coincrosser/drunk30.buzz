'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Mic2, Layout, Users, Heart } from 'lucide-react'
import React from 'react'
import type { ComponentType } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/episodes', label: 'Episodes' },
  { href: '/links', label: 'Links' },
  { href: '/join', label: 'Join' },
]

const studioLinks = [
  { href: '/studio', label: 'Dashboard', icon: Layout },
  { href: '/studio/new', label: 'New Episode', icon: Mic2 },
  { href: '/studio/crm', label: 'CRM', icon: Users },
  { href: '/studio/recovery', label: 'Recovery', icon: Heart },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isStudio = pathname.startsWith('/studio')

  const links = isStudio ? studioLinks : publicLinks

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">drunk30</span>
            <span className="text-muted-foreground">.buzz</span>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-foreground/80',
                pathname === link.href
                  ? 'text-foreground'
                  : 'text-foreground/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-2">
          {isStudio ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/">View Site</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/studio">Studio</Link>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container py-4 flex flex-col space-y-3">
            {links.map((link) => {
              const Icon = 'icon' in link ? link.icon : null
              const iconNode: React.ReactNode = Icon ? React.createElement(Icon as any, { className: 'h-4 w-4' }) : null
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center space-x-2 py-2 transition-colors',
                    pathname === link.href
                      ? 'text-foreground font-medium'
                      : 'text-foreground/60'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {iconNode}
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <div className="pt-2 border-t">
              {isStudio ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">View Site</Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/studio">Studio</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
