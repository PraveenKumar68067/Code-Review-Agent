import { ArrowRight, BrainCircuit, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewResult } from "@/lib/models";

type ComparisonPanelProps = {
  baseline: ReviewResult | null;
  memoryAware: ReviewResult | null;
};

function issueStory(issue: ReviewResult["issues"][number], mode: "baseline" | "memory") {
  if (mode === "baseline") {
    return issue.suggestion || issue.explanation;
  }

  const parts = [
    issue.architectureGuidance,
    issue.learningNote,
    issue.similarFixPattern,
    issue.suggestion,
  ].filter(Boolean);

  return parts[0] ?? issue.explanation;
}

export function ComparisonPanel({ baseline, memoryAware }: ComparisonPanelProps) {
  const scoreDelta = baseline && memoryAware ? memoryAware.scores.overall - baseline.scores.overall : 0;
  const memorySignalsAdded =
    baseline && memoryAware
      ? memoryAware.memoriesUsed.length + memoryAware.repeatedMistakes.length + memoryAware.reusableFixPatterns.length
      : 0;
  const contextLiftLabel =
    baseline && memoryAware
      ? scoreDelta > 0
        ? "Memory context improved the score and the review quality."
        : scoreDelta === 0
          ? "Same code score, but memory made the review much more specific."
          : "The score stayed stricter, but the review gained more team context."
      : "Run both modes to measure the lift.";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50/70 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Baseline Code Score</p>
            <p className="mt-2 text-2xl font-semibold">{baseline?.scores.overall ?? "--"}</p>
            <p className="mt-1 text-sm text-slate-600">Generic review with no team memory.</p>
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/80 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Memory Context Score</p>
            <p className="mt-2 text-2xl font-semibold">{memoryAware?.scores.overall ?? "--"}</p>
            <p className="mt-1 text-sm text-slate-600">Team-aware review with history and rule retrieval.</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Context Lift</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{baseline && memoryAware ? `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}` : "--"}</p>
            <p className="mt-1 text-sm text-slate-600">{contextLiftLabel}</p>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Memory Signals Added</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{baseline && memoryAware ? `+${memorySignalsAdded}` : "--"}</p>
            <p className="mt-1 text-sm text-slate-600">Extra rules, repeats, and reusable patterns unlocked.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/80 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-amber-500" />
              Without Memory
            </CardTitle>
            <CardDescription>Generic baseline review with no team context, historical memory, or accepted fix patterns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {baseline ? (
              baseline.issues.map((issue) => (
                <div key={issue.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{issue.title}</p>
                    <Badge variant="outline">Generic</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{issueStory(issue, "baseline")}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">No team rules, no historical context, no memory attribution</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Run a review to capture the generic baseline.</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-sky-200 bg-sky-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-sky-500" />
              With Memory
            </CardTitle>
            <CardDescription>Team-aware review enriched with retrieved rules, repeated mistakes, and previously accepted feedback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memoryAware ? (
              memoryAware.issues.map((issue) => (
                <div key={issue.id} className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{issue.title}</p>
                    <Badge variant="info">Team-aware</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{issueStory(issue, "memory")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {issue.memoryUsed.length > 0 ? <Badge variant="success">Memory used: {issue.memoryUsed.join(", ")}</Badge> : null}
                    {issue.architectureMatch ? <Badge variant="info">Architecture preference triggered</Badge> : null}
                    {issue.repeatedIssue || issue.similarPastIssue ? <Badge variant="warning">History-aware issue detection</Badge> : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Run a memory-enabled review to show team-aware output.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
