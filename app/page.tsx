import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-accent" />
                AI-Powered Investment Analysis
              </div>

              <h1 className="text-pretty text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Smarter Real Estate Decisions for New England
              </h1>

              <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Analyze rental properties, compare deals, and get AI-driven
                recommendations. Built specifically for New England investors
                and brokers.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="min-w-[200px]">
                  <Link href="/underwrite">
                    Start Underwriting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="min-w-[200px] bg-transparent"
                >
                  <Link href="/about">Learn How It Works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y border-border bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three simple steps to smarter investment decisions
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  1. Enter Properties
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Add 2-5 candidate rental properties with their financial
                  details. Use auto-fill to speed up data entry.
                </p>
              </div>

              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  2. AI Analysis
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Our agentic AI computes ROI, cap rates, cash flow projections,
                  and identifies risks across all properties.
                </p>
              </div>

              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  3. Get Recommendations
                </h3>
                <p className="mt-2 text-muted-foreground">
                  See ranked results with clear buy/watch/avoid signals and
                  detailed 5-year projections for each deal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built for Serious Investors
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to make confident investment decisions
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <BarChart3 className="mb-4 h-8 w-8 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Comprehensive Metrics
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cap rate, cash-on-cash return, NOI, and 5-year ROI
                    calculated automatically for each property.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <Brain className="mb-4 h-8 w-8 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">
                    AI Underwriters
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Multiple AI agents analyze cash flow, risk, market timing,
                    and renovation impact for each deal.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <CheckCircle2 className="mb-4 h-8 w-8 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Clear Recommendations
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Get actionable buy/watch/avoid signals with plain-English
                    explanations of the reasoning.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
              Ready to Find Your Next Deal?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
              Start analyzing New England rental properties today. No account
              required.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="min-w-[200px]"
              >
                <Link href="/underwrite">
                  Start Underwriting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
