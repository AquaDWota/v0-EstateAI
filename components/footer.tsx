import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            {/* <Building2 className="h-6 w-6 text-foreground" /> */}
            <span className="text-base font-semibold text-foreground">
              Estate.AI
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            {/* <Link
              href="/underwrite"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Underwrite
            </Link> */}
            <Link
              href="/about"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            Built for New England investors
          </p>
        </div>
      </div>
    </footer>
  );
}
