import Link from 'next/link'
import { ExternalLink, Youtube, Twitter, Github, Mail, Mic2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const links = [
  {
    title: 'YouTube Channel',
    description: 'Watch all episodes and subscribe',
    href: 'https://youtube.com/@drunk30',
    icon: Youtube,
    external: true,
  },
  {
    title: 'Latest Episode',
    description: 'Watch the most recent episode',
    href: '/episodes',
    icon: Mic2,
    external: false,
  },
  {
    title: 'Twitter / X',
    description: 'Follow for updates and thoughts',
    href: 'https://twitter.com/drunk30',
    icon: Twitter,
    external: true,
  },
  {
    title: 'GitHub',
    description: 'See what I\'m building',
    href: 'https://github.com/drunk30',
    icon: Github,
    external: true,
  },
  {
    title: 'Join Email List',
    description: 'Get notified about new content',
    href: '/join',
    icon: Mail,
    external: false,
  },
]

export const metadata = {
  title: 'Links',
  description: 'All the important links in one place.',
}

export default function LinksPage() {
  return (
    <div className="container max-w-lg py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-3xl font-bold">d30</span>
        </div>
        <h1 className="text-2xl font-bold">drunk30.buzz</h1>
        <p className="text-muted-foreground mt-1">
          Build anyway. Recover loudly. Ship consistently.
        </p>
      </div>

      <div className="space-y-3">
        {links.map((link) => {
          const Icon = link.icon
          const LinkWrapper = link.external ? 'a' : Link
          const linkProps = link.external
            ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
            : { href: link.href }

          return (
            <Card key={link.href} className="hover:bg-muted/50 transition-colors">
              <LinkWrapper {...linkProps}>
                <CardContent className="flex items-center p-4">
                  <div className="flex-shrink-0 mr-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium truncate">{link.title}</h2>
                    <p className="text-sm text-muted-foreground truncate">
                      {link.description}
                    </p>
                  </div>
                  {link.external && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                  )}
                </CardContent>
              </LinkWrapper>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          51. Building. Recovering. Shipping.
        </p>
      </div>
    </div>
  )
}
