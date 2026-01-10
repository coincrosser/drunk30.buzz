import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by{' '}
          <Link
            href="/links"
            className="font-medium underline underline-offset-4"
          >
            drunk30
          </Link>
          . Build anyway. Recover loudly. Ship consistently.
        </p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Link href="/episodes" className="hover:underline underline-offset-4">
            Episodes
          </Link>
          <Link href="/join" className="hover:underline underline-offset-4">
            Join
          </Link>
          <Link href="/links" className="hover:underline underline-offset-4">
            Links
          </Link>
        </div>
      </div>
    </footer>
  )
}
