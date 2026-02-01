"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          {/* <Building2 className="h-9 w-9 text-foreground" /> */}
          <span className="text-3xl font-bold text-foreground">
            Estate.AI
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <Link
            href="/"
            className={cn(
              "text-xl font-semibold transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={cn(
              "text-xl font-semibold transition-colors hover:text-foreground",
              pathname === "/about"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild size="lg" className="text-base font-semibold">
            <Link href="/map?address=02125">Explore Properties</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
