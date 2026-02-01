import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Bot,
  Building2,
  DollarSign,
  Shield,
  Clock,
  Wrench,
  FileText,
  Users,
  MapPin,
  BarChart3,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                How It Works
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                New England Deal Underwriter uses a multi-agent AI system to
                analyze rental properties from multiple perspectives, giving you
                comprehensive insights to make confident investment decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Target Users */}
        <section className="border-y border-border bg-card py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Built For
              </h2>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-background h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader>
                    <Users className="mb-2 h-8 w-8 text-accent" />
                    <CardTitle>New Investors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      First-time rental property buyers looking to analyze deals
                      with professional-grade metrics and understand investment
                      fundamentals.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-background h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader>
                    <Building2 className="mb-2 h-8 w-8 text-accent" />
                    <CardTitle>Experienced Investors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Portfolio owners who need to quickly compare multiple
                      properties and identify the best opportunities in their
                      target markets.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-background h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader>
                    <BarChart3 className="mb-2 h-8 w-8 text-accent" />
                    <CardTitle>Brokers & Agents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Real estate professionals who want to provide clients with
                      detailed investment analysis and data-driven
                      recommendations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* The AI Committee */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-accent" />
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                The AI Investment Committee
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Your deals are analyzed by multiple specialized AI agents, each
                focusing on a critical aspect of the investment
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <DollarSign className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">Cash-Flow Agent</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Analyzes income potential, operating expenses, and monthly
                      cash flow projections. Evaluates rent-to-price ratios and
                      identifies opportunities to optimize returns.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Shield className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">Risk Agent</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Evaluates investment risk factors including vacancy
                      exposure, expense ratios, and return volatility. Assigns
                      risk ratings and identifies potential red flags.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Clock className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">
                        Market-Timing Agent
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Assesses whether current pricing supports immediate
                      acquisition or if waiting for better terms would be
                      advisable. Provides buy/watch/avoid recommendations.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Wrench className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">Renovation Agent</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reviews value-add potential through renovations. Compares
                      renovation budgets against projected ARV increases to
                      evaluate improvement ROI.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <FileText className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">Summary Agent</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Synthesizes insights from all other agents into a cohesive
                      recommendation. Generates the final score and provides
                      actionable guidance.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Bot className="h-5 w-5 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">Combined Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      All agents work together to rank your properties, highlight
                      the best opportunities, and provide clear reasoning you can
                      act on.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="border-y border-border bg-card py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-accent" />
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Data & Methodology
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our analysis is built on established real estate investment
                metrics and New England market data
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-3xl">
              <Card className="border-border bg-background">
                <CardContent className="divide-y divide-border p-0">
                  <div className="p-6">
                    <h3 className="font-semibold text-foreground">
                      Financial Metrics
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Standard amortization formulas for mortgage calculations,
                      NOI-based cap rates, and cash-on-cash return calculations
                      used by professional investors.
                    </p>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-foreground">
                      Market Defaults
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      ZIP-code-based defaults for property taxes, insurance
                      rates, and typical rent ranges across New England markets
                      (MA, NH, ME, VT, CT, RI).
                    </p>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-foreground">
                      5-Year Projections
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Simplified ROI projections incorporating annual
                      appreciation, principal paydown, and cumulative cash flow
                      over a 5-year holding period.
                    </p>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-foreground">
                      Risk Assessment
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Risk levels derived from cash-on-cash returns and cash
                      flow position. Properties with negative cash flow or sub-3%
                      returns are flagged as higher risk.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Note: This tool provides estimates based on user inputs and
                market assumptions. Always verify data with local professionals
                before making investment decisions.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Ready to Analyze Your Next Property?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Start comparing New England properties in minutes.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/map">
                  Start Exploring
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
