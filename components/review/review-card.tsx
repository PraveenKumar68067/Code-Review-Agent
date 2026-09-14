import { AlertTriangle, BookCheck, Repeat2, ShieldCheck } from "lucide-react";

import { FeedbackActions } from "@/components/review/feedback-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewIssue } from "@/lib/models";
import { titleCase } from "@/lib/utils";

function severityVariant(severity: ReviewIssue["severity"]) {
  if (severity === "high") return "danger";
  if (severity === "medium") return "warning";
  return "info";
}

type ReviewCardProps = {
  issue: ReviewIssue;
  userId: string;
  workspaceId: string;
  language: string;
  onMemoryAction: (action: "team_rule" | "common_mistake" | "architecture_preference", issue: ReviewIssue) => Promise<void>;
};

export function ReviewCard({ issue, userId, workspaceId, language, onMemoryAction }: ReviewCardProps) {
  const hasMemoryValue = issue.memoryUsed.length > 0 || issue.architectureMatch || issue.repeatedIssue || issue.similarPastIssue;
  const teamRuleMatched = issue.memoryUsed.some((memory) => {
    const lower = memory.toLowerCase();
    return lower.includes("rule") || lower.includes("team") || lower.includes("standard");
  });
  const memoryChips = issue.memoryUsed.map((memory) => {
    const lower = memory.toLowerCase();
    if (lower.includes("rule") || lower.includes("preference") || lower.includes("team")) {
      return { label: memory, variant: "info" as const };
    }
    if (lower.includes("accept") || lower.includes("helpful") || lower.includes("pattern")) {
      return { label: memory, variant: "success" as const };
    }
    if (lower.includes("mistake") || lower.includes("repeat") || lower.includes("history")) {
      return { label: memory, variant: "warning" as const };
    }
    return { label: memory, variant: "outline" as const };
  });

  return (
    <Card className={`overflow-hidden border-border/80 bg-white shadow-sm ${hasMemoryValue ? "ring-1 ring-sky-100 shadow-md" : ""}`}>
      <CardHeader className={`gap-3 border-b border-border/70 ${hasMemoryValue ? "bg-sky-50/60" : "bg-slate-50/70"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-base text-slate-950">{issue.title}</CardTitle>
            {hasMemoryValue ? (
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-700">Memory-backed review insight</p>
            ) : (
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Generic review finding</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant(issue.severity)}>{issue.severity.toUpperCase()}</Badge>
            <Badge variant="outline">{titleCase(issue.category)}</Badge>
            {issue.repeatedIssue ? <Badge variant="warning">Repeated Mistake</Badge> : null}
            {teamRuleMatched ? <Badge variant="success">Team Rule Match</Badge> : null}
            {issue.architectureMatch ? <Badge variant="info">Architecture Preference Match</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border/70 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Explanation</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{issue.explanation}</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
              <p className="text-sm font-medium text-slate-900">Why It Matters</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{issue.whyItMatters}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
              <p className="text-sm font-medium text-slate-900">Suggested Fix</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{issue.suggestion}</p>
            </div>
          </div>
        </div>

        {issue.architectureGuidance ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
            <p className="text-sm font-medium text-sky-950">Architecture Preference Triggered</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{issue.architectureGuidance}</p>
          </div>
        ) : null}
        {issue.learningNote ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <p className="text-sm font-medium text-emerald-950">Personalized Coaching</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{issue.learningNote}</p>
          </div>
        ) : null}
        {issue.similarFixPattern ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-medium text-amber-950">Reusable Fix Pattern</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{issue.similarFixPattern}</p>
          </div>
        ) : null}
        {issue.fixExample ? (
          <div>
            <p className="text-sm font-medium">Suggested Patch</p>
            <pre className="mt-2 overflow-auto rounded-xl border border-border bg-slate-950 p-4 text-xs text-slate-100">
              <code>{issue.fixExample}</code>
            </pre>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {issue.architectureMatch ? (
            <Badge variant="info" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Architecture Preference Match
            </Badge>
          ) : null}
          {issue.repeatedIssue ? (
            <Badge variant="warning" className="gap-1">
              <Repeat2 className="h-3.5 w-3.5" />
              Repeated Mistake
            </Badge>
          ) : null}
          {issue.similarPastIssue ? (
            <Badge variant="default" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Similar to Past Review
            </Badge>
          ) : null}
        </div>

        <div className={`rounded-2xl border p-4 ${hasMemoryValue ? "border-sky-200 bg-sky-50/70" : "border-border/70 bg-slate-50/70"}`}>
          <div className="flex items-center gap-2">
            <BookCheck className={`h-4 w-4 ${hasMemoryValue ? "text-sky-600" : "text-slate-500"}`} />
            <p className="text-sm font-medium text-slate-900">Memory Attribution</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {memoryChips.length > 0 ? (
              memoryChips.map((chip) => (
                <Badge key={chip.label} variant={chip.variant}>
                  {chip.label}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">No memory signals used</Badge>
            )}
            {teamRuleMatched ? <Badge variant="success">Team rule matched</Badge> : null}
            {issue.architectureMatch ? <Badge variant="info">Architecture preference triggered</Badge> : null}
            {issue.similarPastIssue ? <Badge variant="warning">Similar past mistake matched</Badge> : null}
            {issue.repeatedIssue ? <Badge variant="warning">Repeated mistake detected</Badge> : null}
          </div>
        </div>
        <FeedbackActions issue={issue} userId={userId} workspaceId={workspaceId} language={language} onMemoryAction={onMemoryAction} />
      </CardContent>
    </Card>
  );
}
