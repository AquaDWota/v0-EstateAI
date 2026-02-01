"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building,
  CheckCircle2,
  TrendingUp,
  Search,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [address, setAddress] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      router.push(`/map?address=${encodeURIComponent(address)}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Address Input */}
        <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
          {/* Map Background Layer with gradient overlay */}
          <div className="absolute inset-0 -z-20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2948.3563224020837!2d-71.05773268455701!3d42.36008797918487!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e370a5cb30cc5f%3A0xc53a8e6489686c87!2sBoston%2C%20MA!5e0!3m2!1sen!2sus!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(100%) brightness(0.4)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Gradient overlay for smooth blend */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/90 via-background/55 to-background/90" />

          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-sm font-medium text-color-black backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Investment Analysis
              </div>

              <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Analyze Any Property
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  In Seconds
                </span>
              </h1>

              <p className="mt-6 text-balance text-xl leading-relaxed text-bold-foreground sm:text-2xl">
                Enter an address and get instant AI-powered investment insights
                for New England real estate
              </p>

              {/* Address Search Input */}
              <form onSubmit={handleSearch} className="mt-12">
                <div className="mx-auto max-w-2xl">
                  <div className="group relative">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20" />
                    <div className="relative flex items-center gap-3 rounded-2xl bg-card p-3 transition-all sm:p-4">
                      <MapPin className="h-6 w-6 flex-shrink-0 text-muted-foreground sm:h-7 sm:w-7" />
                      <Input
                        type="text"
                        placeholder="Enter property address (e.g., 123 Main St, Boston, MA)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="flex-1 border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg"
                      />
                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 flex-shrink-0 gap-2 px-6 sm:px-8"
                      >
                        <Search className="h-5 w-5" />
                        <span className="hidden sm:inline">Analyze</span>
                      </Button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Or{" "}
                    <Link
                      href="/map"
                      className="font-medium text-primary underline decoration-solid underline-offset-4 hover:underline"
                    >
                      browse the map
                    </Link>{" "}
                    to explore properties in your area
                  </p>
                </div>
              </form>

              {/* Quick Stats */}
              <div className="mt-16 grid grid-cols-3 gap-6 sm:gap-8">
                <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm sm:p-6">
                  <div className="text-3xl font-bold text-foreground sm:text-4xl">
                    10K+
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Properties Analyzed
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm sm:p-6">
                  <div className="text-3xl font-bold text-foreground sm:text-4xl">
                    6
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    States Covered
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm sm:p-6">
                  <div className="text-3xl font-bold text-foreground sm:text-4xl">
                    AI
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Powered Analysis
                  </div>
                </div>
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
              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
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
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
                  <CardContent className="p-6">
                    <Brain className="mb-4 h-8 w-8 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Multi-Agentic Approach
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Multiple AI agents analyze cash flow, risk, market timing,
                      and renovation impact for each deal.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="transform transition-transform duration-300 hover:-translate-y-2">
                <Card className="border-2 border-border bg-card h-full transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-lg cursor-pointer">
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
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
              Ready to Find Your Next Property?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
              Start analyzing New England properties today. No account
              required.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="min-w-[200px]"
              >
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
