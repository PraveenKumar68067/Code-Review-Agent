import { ArrowDownRight, ArrowUpRight, BrainCircuit, Repeat2, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImprovementItem, ReviewResult } from "@/lib/models";

function DirectionIcon({ direction }: { direction: ImprovementItem["direction"] }) {
  if (direction === "up") return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
  if (direction === "down") return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
  return <Repeat2 className="h-4 w-4 text-amber-500" />;
}

export function JudgingHighlights({ result }: { result: ReviewResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="border-sky-500/20 bg-sky-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4 text-sky-500" />
            Memory Was Used
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.memoryHighlights.length > 0 ? result.memoryHighlights.map((item) => (
            <div key={item.title} className="rounded-xl bg-background/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.title}</p>
                <DirectionIcon direction={item.direction} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">Memory mode is off for this run, so the agent reviewed the code without team context.</p>}
        </CardContent>
      </Card>

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            Improvement Since Last Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.improvementSinceLastReview.map((item) => (
            <div key={item.title} className="rounded-xl bg-background/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.title}</p>
                <DirectionIcon direction={item.direction} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat2 className="h-4 w-4 text-amber-500" />
            Repeated Mistakes I'm Still Making
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.repeatedMistakes.length > 0 ? result.repeatedMistakes.map((item) => (
            <div key={item.title} className="rounded-xl bg-background/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.title}</p>
                <DirectionIcon direction={item.direction} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No repeated mistake pattern was matched in this run.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
