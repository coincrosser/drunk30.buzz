import Link from 'next/link'
import { ArrowRight, Mic2, Code, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="container flex flex-col items-center justify-center gap-6 pb-8 pt-6 md:py-10">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
            Build anyway.
            <br className="hidden sm:inline" />
            Recover loudly.
            <br className="hidden sm:inline" />
            Ship consistently.
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            51 years old. Learning to code. Building businesses. On-and-off 
            struggles with alcohol. Documenting it all—imperfect but disciplined.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/episodes">
              Watch Episodes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/join">Join the Journey</Link>
          </Button>
        </div>
      </section>

      <section className="container py-8 md:py-12 lg:py-16">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="text-2xl font-bold leading-[1.1] md:text-3xl">
            What This Is About
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            No hustle-bro energy. No glamorizing the struggle. Just honest 
            documentation of trying to build something meaningful while 
            navigating recovery. AI is leverage, not replacement.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 mt-8">
          <Card>
            <CardHeader>
              <Mic2 className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Podcast & YouTube</CardTitle>
              <CardDescription>
                Regular episodes documenting the journey of building, learning, 
                and recovery. Raw, unfiltered, and real.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Code className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Building in Public</CardTitle>
              <CardDescription>
                Learning to code at 51. Building real products. Sharing the 
                wins, failures, and everything in between.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Heart className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Recovery Journey</CardTitle>
              <CardDescription>
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
