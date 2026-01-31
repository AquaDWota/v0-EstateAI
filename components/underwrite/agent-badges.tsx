"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  DollarSign,
  Shield,
  Clock,
  Wrench,
  FileText,
} from "lucide-react";

const AGENTS = [
  {
    id: "cash-flow",
    name: "Cash-Flow Agent",
    icon: DollarSign,
    description: "Analyzes income and expenses",
  },
  {
    id: "risk",
    name: "Risk Agent",
    icon: Shield,
    description: "Evaluates investment risks",
  },
  {
    id: "market-timing",
    name: "Market-Timing Agent",
    icon: Clock,
    description: "Assesses market conditions",
  },
  {
    id: "renovation",
    name: "Renovation Agent",
    icon: Wrench,
    description: "Reviews improvement potential",
  },
  {
    id: "summary",
    name: "Summary Agent",
    icon: FileText,
    description: "Synthesizes final recommendation",
  },
];

export function AgentBadges() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-accent" />
          AI Underwriters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {AGENTS.map((agent) => (
            <Badge
              key={agent.id}
              variant="secondary"
              className="cursor-default py-1.5"
              title={agent.description}
            >
              <agent.icon className="mr-1.5 h-3.5 w-3.5" />
              {agent.name}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Multiple AI agents analyze each property from different perspectives
          to provide comprehensive recommendations.
        </p>
      </CardContent>
    </Card>
  );
}
