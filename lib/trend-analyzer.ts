import type { TrendSummary } from "@/lib/models";

type HistoryPayload = {
  reviews: Array<{ issues: Array<{ category: string } | Record<string, any>> } | Record<string, any>>;
  trends: Array<{ overall: number; architectureAlignment?: number; reliability?: number; maintainability?: number; readability?: number; teamAlignment?: number } | Record<string, any>>;
};

export function buildTrendSummary(
  history: HistoryPayload,
  currentIssueCategories: string[],
  currentOverall: number,
): TrendSummary {
  const normalizedTrends = history.trends.map((entry) => ({
    overall: Number(entry.overall ?? 0),
    architectureAlignment: Number((entry as any).architectureAlignment ?? (entry as any).architecture ?? 0),
    reliability: Number(entry.reliability ?? 0),
    maintainability: Number(entry.maintainability ?? 0),
    readability: Number(entry.readability ?? 0),
    teamAlignment: Number(entry.teamAlignment ?? 0),
  }));
  const normalizedReviews = history.reviews.map((review) => ({
    issues: (review.issues ?? []).map((issue: any) => ({
      category: String(issue.category ?? "readability"),
    })),
  }));

  const priorScores = normalizedTrends.map((entry) => entry.overall);
  const previousScore = priorScores.at(-1) ?? currentOverall;

  const issueCounter = new Map<string, number>();
  for (const review of normalizedReviews.slice(-5)) {
    for (const issue of review.issues) {
      issueCounter.set(issue.category, (issueCounter.get(issue.category) ?? 0) + 1);
    }
  }

  const weakAreas = [...issueCounter.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  const latestTrend = normalizedTrends.at(-1);
  const strengthAreas = [
    latestTrend?.readability && latestTrend.readability >= 80 ? "readability" : null,
    latestTrend?.maintainability && latestTrend.maintainability >= 80 ? "maintainability" : null,
    !currentIssueCategories.includes("validation") ? "validation" : null,
    latestTrend?.teamAlignment && latestTrend.teamAlignment >= 80 ? "team alignment" : null,
  ].filter(Boolean).filter((item) => !weakAreas.includes(item as string)).slice(0, 3) as string[];
  const repeatedIssueTypes = [...new Set(currentIssueCategories.filter((category) => (issueCounter.get(category) ?? 0) >= 2))];

  const architectureScores = normalizedTrends.slice(-3).map((entry) => entry.architectureAlignment ?? 0);
  const architectureTrend =
    architectureScores.length >= 2 && architectureScores.at(-1)! <= architectureScores[0]
      ? "Architecture alignment is still inconsistent across recent submissions."
      : "Architecture alignment improved compared with previous submissions.";

  const summaryLines: string[] = [];
  if (currentOverall > previousScore) {
    summaryLines.push("Overall code quality is improving compared with recent reviews.");
  } else if (currentOverall < previousScore) {
    summaryLines.push("Overall review quality dipped compared with the most recent submission.");
  } else {
    summaryLines.push("Overall quality is stable compared with recent submissions.");
  }

  if (!currentIssueCategories.includes("validation") && (issueCounter.get("validation") ?? 0) >= 2) {
    summaryLines.push("Validation quality improved compared to your last reviews.");
  }
  if (!currentIssueCategories.includes("architecture") && architectureScores.length >= 2 && architectureScores.at(-1)! >= architectureScores[0]) {
    summaryLines.push("Your code is becoming more aligned with the team's service-layer architecture.");
  }
  if (currentIssueCategories.includes("reliability")) {
    summaryLines.push("Error handling is still a repeated weakness.");
  }
  if (currentIssueCategories.includes("maintainability") && (issueCounter.get("maintainability") ?? 0) >= 2) {
    summaryLines.push("Duplicate logic remains a recurring pattern.");
  }
  if (!currentIssueCategories.includes("maintainability") && (issueCounter.get("maintainability") ?? 0) >= 2) {
    summaryLines.push("You reduced duplicate logic compared with earlier examples.");
  }
  summaryLines.push(architectureTrend);

  return {
    summaryLines,
    repeatedIssueTypes,
    strengthAreas,
    weakAreas,
    architectureTrend,
    scoreDirection: currentOverall > previousScore ? "improving" : currentOverall < previousScore ? "declining" : "stable",
  };
}
