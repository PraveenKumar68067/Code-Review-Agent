import { GitBranchPlus, Wrench } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReusableFixPattern } from "@/lib/models";

export function FixPatternsPanel({ patterns }: { patterns: ReusableFixPattern[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-4 w-4 text-sky-500" />
          Fix Similar Issues
        </CardTitle>
        <CardDescription>Reusable refactor patterns the team can apply the next time this issue shows up.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2">
        {patterns.length > 0 ? patterns.map((pattern) => (
          <div key={`${pattern.title}-${pattern.category}`} className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{pattern.title}</p>
              <GitBranchPlus className="h-4 w-4 text-sky-500" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{pattern.applyWhen}</p>
            <div className="mt-3 rounded-xl bg-background p-3 text-sm whitespace-pre-wrap">{pattern.reusablePattern}</div>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{pattern.source}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No reusable fix pattern was generated for this review yet.</p>}
      </CardContent>
    </Card>
  );
}
