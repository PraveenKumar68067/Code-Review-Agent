import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewResult } from "@/lib/models";

type TrendPanelProps = {
  result: ReviewResult;
  historyTrendData: Array<{ timestamp: string; overall: number }>;
};

export function TrendPanel({ result, historyTrendData }: TrendPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Trend Summary</CardTitle>
          <CardDescription>See whether code quality is improving, flat, or repeating the same weaknesses over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={result.scores.trendDirection === "improving" ? "success" : result.scores.trendDirection === "declining" ? "danger" : "warning"}>
              {result.scores.trendDirection}
            </Badge>
            <Badge variant="outline">Previous {result.scores.previousOverall}</Badge>
            <Badge variant="outline">Current {result.scores.overall}</Badge>
            <Badge variant="outline">Delta {result.scores.delta >= 0 ? `+${result.scores.delta}` : result.scores.delta}</Badge>
          </div>
          <div className="space-y-3">
            {result.trendSummary.summaryLines.map((line) => (
              <div key={line} className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                {line}
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Strengths Trend</p>
              <p className="mt-2 text-sm">{result.trendSummary.strengthAreas.join(", ") || "None highlighted yet"}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Weak Areas</p>
              <p className="mt-2 text-sm">{result.trendSummary.weakAreas.join(", ") || "No persistent weakness captured"}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Repeated Issue Types</p>
              <p className="mt-2 text-sm">{result.trendSummary.repeatedIssueTypes.join(", ") || "No repeated issue this time"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
          <CardDescription>Recent overall score movement across saved reviews.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyTrendData}>
              <XAxis dataKey="timestamp" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis domain={[40, 100]} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="overall" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
