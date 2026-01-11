import Link from 'next/link'
import { ArrowRight, Mic2, Code, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="flex flex-col relative">
      {/* Animated grid background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 0, 110, 0.1) 2px, rgba(255, 0, 110, 0.1) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(251, 86, 7, 0.1) 2px, rgba(251, 86, 7, 0.1) 4px)
            `
          }}
        />
      </div>

      <section className="container relative z-10 flex flex-col items-center justify-center gap-6 pb-8 pt-24 md:py-32">
        <div className="flex max-w-[980px] flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl">
            <span className="block animate-[logoFloat_3s_ease-in-out_infinite]">
              Build anyway.
            </span>
            <span className="block gradient-text text-6xl md:text-8xl lg:text-9xl my-2">
              Recover loudly.
            </span>
            <span className="block neon-glow text-5xl md:text-7xl lg:text-8xl" style={{ color: 'hsl(var(--laser-yellow))' }}>
              Ship consistently.
            </span>
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl opacity-80 font-[\'Oswald\',sans-serif] tracking-wide">
            51 years old. Learning to code. Building businesses. On-and-off 
            struggles with alcohol. Documenting it all—imperfect but disciplined.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row mt-6">
          <Button asChild size="lg" className="relative overflow-hidden group bg-gradient-to-r from-[hsl(var(--neon-pink))] to-[hsl(var(--electric-orange))] hover:shadow-[0_10px_40px_rgba(255,0,110,0.6)] transition-all hover:-translate-y-1">
            <Link href="/episodes" className="font-[\'Oswald\',sans-serif] tracking-wider">
              <span className="relative z-10">Watch Episodes</span>
              <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="neon-border hover:bg-[hsl(var(--electric-orange))] hover:text-[hsl(var(--void-black))] transition-all hover:-translate-y-1 font-[\'Oswald\',sans-serif] tracking-wider">
            <Link href="/join">Join the Journey</Link>
          </Button>
        </div>
      </section>

      <section className="container relative z-10 py-16 md:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-6 text-center">
          <h2 className="text-4xl font-bold md:text-5xl gradient-text">
            What This Is About
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7 opacity-80">
            No hustle-bro energy. No glamorizing the struggle. Just honest 
            documentation of trying to build something meaningful while 
            navigating recovery. AI is leverage, not replacement.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 mt-12">
          <Card className="neon-border bg-card/50 backdrop-blur hover:bg-card/80 transition-all hover:-translate-y-2">
            <CardHeader>
              <Mic2 className="h-12 w-12 mb-2" style={{ color: 'hsl(var(--neon-pink))' }} />
              <CardTitle className="text-xl">Podcast & YouTube</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Regular episodes documenting the journey of building, learning, 
                and recovery. Raw, unfiltered, and real.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="neon-border bg-card/50 backdrop-blur hover:bg-card/80 transition-all hover:-translate-y-2">
            <CardHeader>
              <Code className="h-12 w-12 mb-2" style={{ color: 'hsl(var(--electric-orange))' }} />
              <CardTitle className="text-xl">Building in Public</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Learning to code at 51. Building real products. Sharing the 
                wins, failures, and everything in between.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="neon-border bg-card/50 backdrop-blur hover:bg-card/80 transition-all hover:-translate-y-2">
            <CardHeader>
              <Heart className="h-12 w-12 mb-2" style={{ color: 'hsl(var(--laser-yellow))' }} />
              <CardTitle className="text-xl">Recovery Journey</CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Not medical advice. Not glamorization. Just honest reflection 
                on the ongoing work of staying sober and staying focused.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="container py-8 md:py-12 lg:py-16 border-t">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-bold leading-[1.1] md:text-3xl">
            The Philosophy
          </h2>
          <div className="max-w-[85%] space-y-4 text-muted-foreground sm:text-lg">
            <p>
              <strong className="text-foreground">Favor clarity over cleverness.</strong>{' '}
              I&apos;m learning as I go. If I can understand it, maybe you can too.
            </p>
            <p>
              <strong className="text-foreground">Favor momentum over perfection.</strong>{' '}
              Shipped and imperfect beats stuck and waiting.
            </p>
            <p>
              <strong className="text-foreground">Favor honesty over image.</strong>{' '}
              Recovery isn&apos;t pretty. Building isn&apos;t glamorous. That&apos;s okay.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-12 lg:py-16 border-t bg-muted/50">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-bold leading-[1.1] md:text-3xl">
            Ready to Follow Along?
          </h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Get notified when new episodes drop. No spam. Just updates.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link href="/join">
              Join the Email List
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
