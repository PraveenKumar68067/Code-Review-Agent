"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock3, History, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReviewHistoryEntry } from "@/lib/models";

type ReviewHistoryProps = {
  reviews: ReviewHistoryEntry[];
  teamRules: Array<Record<string, any>>;
};

function formatTimestamp(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "Unknown time";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function ReviewHistory({ reviews, teamRules }: ReviewHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  const sortedReviews = useMemo(
    () => [...reviews].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp)),
    [reviews],
  );
  const latestReview = sortedReviews[0];
  const previousReview = sortedReviews[1];
  const averageScore = sortedReviews.length > 0
    ? Math.round(sortedReviews.reduce((total, review) => total + (review.scores?.overall ?? 0), 0) / sortedReviews.length)
    : 0;
  const latestScore = latestReview?.scores?.overall ?? 0;
  const previousScore = previousReview?.scores?.overall ?? 0;
  const scoreDelta = latestReview && previousReview ? latestScore - previousScore : 0;
  const repeatedIssueTypes = Array.from(
    sortedReviews
      .flatMap((review) => review.issues ?? [])
      .reduce<Map<string, number>>((map, issue) => map.set(String(issue.category ?? "readability"), (map.get(String(issue.category ?? "readability")) ?? 0) + 1), new Map<string, number>())
      .entries() as IterableIterator<[string, number]>,
  )
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  const visibleReviews = expanded ? sortedReviews : sortedReviews.slice(0, 3);

  if (sortedReviews.length === 0) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workspace History</CardTitle>
            <CardDescription>This workspace has not saved any reviews yet. Run a review here to start isolated score history and trend tracking.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Latest Review</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">--</p>
              <p className="mt-1 text-sm text-slate-600">No review has been saved in this workspace yet.</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Average Score</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">--</p>
              <p className="mt-1 text-sm text-slate-600">Average will be calculated only from this workspace.</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Reviews Saved</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">0</p>
              <p className="mt-1 text-sm text-slate-600">No cross-workspace history is shown here.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest Team Rules</CardTitle>
            <CardDescription>Shared rules stay global, even while history remains isolated per workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamRules.slice(-4).reverse().map((rule) => (
              <div key={rule.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">{rule.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{rule.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium">Average Workspace Score</p>
            <p className="mt-3 text-3xl font-semibold">{averageScore || "--"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Average across every saved review in this workspace.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium">Latest Review</p>
            <p className="mt-3 text-3xl font-semibold">{latestScore || "--"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {previousReview
                ? `${scoreDelta >= 0 ? "+" : ""}${scoreDelta} vs previous workspace review`
                : "This is the first review saved in this workspace."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium">Reviews Saved</p>
            <p className="mt-3 text-3xl font-semibold">{sortedReviews.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Only reviews from this workspace are counted here.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Workspace Review History</CardTitle>
              <CardDescription>
                Collapsed mode shows the latest workspace snapshot. Expand to inspect the full isolated review record and score progression.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setExpanded((value) => !value)}>
              {expanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-sky-600" />
                  <p className="text-sm font-medium text-slate-900">Latest Review</p>
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-950">{latestReview.reviewId}</p>
                <p className="mt-1 text-sm text-slate-600">{formatTimestamp(latestReview.timestamp)}</p>
              </div>
              <div className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-medium text-slate-900">Average Score</p>
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-950">{averageScore}</p>
                <p className="mt-1 text-sm text-slate-600">Current {latestScore} | Previous {previousScore || "--"}</p>
              </div>
              <div className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-violet-600" />
                  <p className="text-sm font-medium text-slate-900">Repeated Patterns</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {repeatedIssueTypes.length > 0 ? repeatedIssueTypes.map(([category, count]) => (
                    <Badge key={category} variant="outline">
                      {category} x{count}
                    </Badge>
                  )) : <Badge variant="success">No repeated issue families</Badge>}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review</TableHead>
                  <TableHead>Saved</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReviews.map((review, index) => {
                  const previousInTimeline = sortedReviews[index + 1];
                  const reviewScore = review.scores?.overall ?? 0;
                  const reviewDelta = previousInTimeline ? reviewScore - (previousInTimeline.scores?.overall ?? 0) : 0;
                  const issueCount = review.issueCount ?? review.issues?.length ?? 0;

                  return (
                    <TableRow key={review.reviewId}>
                      <TableCell className="font-medium text-slate-900">{review.reviewId}</TableCell>
                      <TableCell>{formatTimestamp(review.timestamp)}</TableCell>
                      <TableCell>{reviewScore}</TableCell>
                      <TableCell className={reviewDelta > 0 ? "text-emerald-700" : reviewDelta < 0 ? "text-rose-700" : "text-slate-500"}>
                        {previousInTimeline ? `${reviewDelta >= 0 ? "+" : ""}${reviewDelta}` : "--"}
                      </TableCell>
                      <TableCell>{issueCount}</TableCell>
                      <TableCell className="max-w-[320px] text-sm text-slate-600">{review.summary}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {!expanded && sortedReviews.length > visibleReviews.length ? (
              <p className="text-sm text-slate-600">
                Showing the latest {visibleReviews.length} reviews from this workspace. Expand to inspect all {sortedReviews.length} saved reviews.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest Team Rules</CardTitle>
            <CardDescription>Shared rules and architecture preferences remain global while score history stays isolated per workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamRules.slice(-5).reverse().map((rule) => (
              <div key={rule.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">{rule.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{rule.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
