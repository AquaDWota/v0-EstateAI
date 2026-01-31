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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-7 w-7 text-foreground" />
          <span className="text-lg font-semibold text-foreground">
            NE Deal Underwriter
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/underwrite"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              pathname === "/underwrite"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            Underwrite
          </Link>
          <Link
            href="/about"
            className={cn(
              "text-sm font-medium transition-colors hover:text-foreground",
              pathname === "/about"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/underwrite">Start Underwriting</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
