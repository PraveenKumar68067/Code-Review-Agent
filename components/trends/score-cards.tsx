import { ArrowDownRight, ArrowUpRight, BrainCircuit, Minus, Repeat2, ShieldCheck, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ReviewResult, ScoreBreakdown } from "@/lib/models";

const placeholderMetrics = [
  {
    label: "Overall Score",
    value: "--",
    detail: "Run a review to score code quality.",
    icon: Sparkles,
  },
  {
    label: "Team Alignment",
    value: "--",
    detail: "Memory mode boosts team-aware scoring.",
    icon: ShieldCheck,
  },
  {
    label: "Memory Hits Used",
    value: "--",
    detail: "Shows how much stored context was retrieved.",
    icon: BrainCircuit,
  },
  {
    label: "Repeated Mistakes",
    value: "--",
    detail: "Counts issues the reviewer has seen before.",
    icon: Repeat2,
  },
] as const;

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
  if (value < 0) return <ArrowDownRight className="h-4 w-4 text-rose-600" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

function detailTone(score: number) {
  if (score >= 75) return "Strong signal";
  if (score < 60) return "Needs attention";
  return "Mixed signal";
}

export function ScoreCards({ result }: { result: ReviewResult | null }) {
  if (!result) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {placeholderMetrics.map((metric) => (
          <Card key={metric.label} className="border-border/80 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                <div className="rounded-full border border-border/80 bg-slate-50 p-2">
                  <metric.icon className="h-4 w-4 text-sky-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-600">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const scores: ScoreBreakdown = result.scores;
  const overallTrendAccent =
    scores.delta > 0
      ? "border-emerald-200 bg-emerald-50/60"
      : scores.delta < 0
        ? "border-rose-200 bg-rose-50/70"
        : "border-border/80 bg-white";
  const metricMeta = [
    {
      label: "Overall Score",
      value: scores.overall,
      detail: `Previous ${scores.previousOverall} | ${scores.delta >= 0 ? "+" : ""}${scores.delta} change`,
      icon: Sparkles,
      accent: scores.delta > 0 ? "bg-emerald-100 text-emerald-700" : scores.delta < 0 ? "bg-rose-100 text-rose-700" : "bg-sky-50 text-sky-700",
      footer: scores.trendDirection,
      trendValue: scores.delta,
      cardClassName: overallTrendAccent,
      progressClassName: scores.delta > 0 ? "bg-emerald-500" : scores.delta < 0 ? "bg-rose-500" : "bg-sky-500",
    },
    {
      label: "Team Alignment",
      value: scores.teamAlignment,
      detail: detailTone(scores.teamAlignment),
      icon: ShieldCheck,
      accent: "bg-emerald-50 text-emerald-700",
      footer: "Matches stored rules and team standards.",
      trendValue: scores.teamAlignment >= 75 ? 1 : scores.teamAlignment < 60 ? -1 : 0,
      cardClassName: "border-border/80 bg-white",
      progressClassName: "bg-emerald-500",
    },
    {
      label: "Architecture Alignment",
      value: scores.architectureAlignment,
      detail: detailTone(scores.architectureAlignment),
      icon: Sparkles,
      accent: "bg-sky-50 text-sky-700",
      footer: "Service-layer and team architecture fit.",
      trendValue: scores.architectureAlignment >= 75 ? 1 : scores.architectureAlignment < 60 ? -1 : 0,
      cardClassName: "border-border/80 bg-white",
      progressClassName: "bg-sky-500",
    },
    {
      label: "Memory Hits Used",
      value: result.memoriesUsed.length,
      detail: result.memoriesUsed.length > 0 ? "Matched rules, habits, and prior feedback." : "No memories were pulled into this run.",
      icon: BrainCircuit,
      accent: "bg-violet-50 text-violet-700",
      footer: `${result.memoryHighlights.length} highlighted insights`,
      trendValue: result.memoriesUsed.length > 0 ? 1 : 0,
      cardClassName: "border-border/80 bg-white",
      progressClassName: "bg-violet-500",
    },
    {
      label: "Repeated Mistakes",
      value: result.repeatedMistakes.length,
      detail: result.repeatedMistakes.length > 0 ? "Recurring issues still showing up." : "No repeated mistakes detected.",
      icon: Repeat2,
      accent: "bg-amber-50 text-amber-700",
      footer: `${result.similarPastIssues.length} historical matches`,
      trendValue: result.repeatedMistakes.length > 0 ? -1 : 1,
      cardClassName: result.repeatedMistakes.length > 0 ? "border-amber-200 bg-amber-50/50" : "border-border/80 bg-white",
      progressClassName: result.repeatedMistakes.length > 0 ? "bg-amber-500" : "bg-emerald-500",
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metricMeta.map((item) => (
        <Card key={item.label} className={`${item.cardClassName} shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
              <div className={`rounded-full p-2 ${item.accent}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-950">{item.value}</span>
              <div className="rounded-full border border-border/80 bg-slate-50 p-2">
                <TrendIcon value={item.trendValue} />
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full ${item.progressClassName}`} style={{ width: `${Math.min(Number(item.value), 100)}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-700">{item.detail}</p>
            <p className={`mt-1 text-[11px] capitalize ${item.trendValue > 0 ? "text-emerald-700" : item.trendValue < 0 ? "text-rose-700" : "text-slate-500"}`}>{item.footer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
