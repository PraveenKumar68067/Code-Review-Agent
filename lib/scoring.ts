import type { ReviewIssue, ScoreBreakdown } from "@/lib/models";
import { clampScore } from "@/lib/utils";

const categoryWeights = {
  reliability: 25,
  maintainability: 20,
  readability: 15,
  architectureAlignment: 20,
  teamAlignment: 20,
} as const;

const deductionRules = {
  reliability: {
    high: 24,
    medium: 14,
    low: 8,
  },
  validation: {
    high: 18,
    medium: 10,
    low: 5,
  },
  maintainability: {
    high: 18,
    medium: 12,
    low: 6,
  },
  naming: {
    high: 10,
    medium: 7,
    low: 4,
  },
  architecture: {
    high: 30,
    medium: 14,
    low: 8,
  },
  logging: {
    high: 12,
    medium: 8,
    low: 4,
  },
  readability: {
    high: 12,
    medium: 8,
    low: 4,
  },
} as const;

function noIssuePerfectScore(previousOverall: number): ScoreBreakdown {
  const overall = 100;
  const delta = previousOverall ? overall - previousOverall : 0;

  return {
    reliability: 100,
    maintainability: 100,
    readability: 100,
    architectureAlignment: 100,
    teamAlignment: 100,
    overall,
    previousOverall,
    delta,
    trendDirection: delta > 2 ? "improving" : delta < -2 ? "declining" : "stable",
  };
}

function applyPenalty(score: number, penalty: number) {
  return clampScore(score - penalty);
}

export function calculateScores(issues: ReviewIssue[], previousOverall = 0): ScoreBreakdown {
  if (issues.length === 0 || (issues.length === 1 && issues[0]?.title === "No major issues detected by the deterministic review engine")) {
    return noIssuePerfectScore(previousOverall);
  }

  let reliability = 100;
  let maintainability = 100;
  let readability = 100;
  let architectureAlignment = 100;
  let teamAlignment = 100;

  for (const issue of issues) {
    const severity = issue.severity;

    if (issue.category === "reliability") {
      reliability = applyPenalty(reliability, deductionRules.reliability[severity]);
      teamAlignment = applyPenalty(teamAlignment, 4);
    }

    if (issue.category === "validation") {
      reliability = applyPenalty(reliability, deductionRules.validation[severity]);
      teamAlignment = applyPenalty(teamAlignment, 8);
    }

    if (issue.category === "maintainability") {
      maintainability = applyPenalty(maintainability, deductionRules.maintainability[severity]);
    }

    if (issue.category === "naming") {
      readability = applyPenalty(readability, deductionRules.naming[severity]);
    }

    if (issue.category === "readability") {
      readability = applyPenalty(readability, deductionRules.readability[severity]);
    }

    if (issue.category === "logging") {
      reliability = applyPenalty(reliability, deductionRules.logging[severity]);
      teamAlignment = applyPenalty(teamAlignment, 6);
    }

    if (issue.category === "architecture") {
      architectureAlignment = applyPenalty(architectureAlignment, deductionRules.architecture[severity]);
      maintainability = applyPenalty(maintainability, 8);
      teamAlignment = applyPenalty(teamAlignment, 14);
    }

    if (issue.repeatedIssue || issue.similarPastIssue || issue.seenBefore) {
      teamAlignment = applyPenalty(teamAlignment, 6);
      architectureAlignment = issue.category === "architecture"
        ? applyPenalty(architectureAlignment, 4)
        : architectureAlignment;
      reliability = issue.category === "validation" || issue.category === "reliability"
        ? applyPenalty(reliability, 4)
        : reliability;
    }

    if (issue.architectureMatch) {
      teamAlignment = applyPenalty(teamAlignment, 4);
      architectureAlignment = applyPenalty(architectureAlignment, 4);
    }

    if (issue.memoryUsed.some((memory) => {
      const lower = memory.toLowerCase();
      return lower.includes("team rule") || lower.includes("architecture preference") || lower.includes("keep api route handlers thin");
    })) {
      teamAlignment = applyPenalty(teamAlignment, 5);
    }
  }

  reliability = clampScore(reliability);
  maintainability = clampScore(maintainability);
  readability = clampScore(readability);
  architectureAlignment = clampScore(architectureAlignment);
  teamAlignment = clampScore(teamAlignment);

  const weightedOverall = (
    reliability * categoryWeights.reliability +
    maintainability * categoryWeights.maintainability +
    readability * categoryWeights.readability +
    architectureAlignment * categoryWeights.architectureAlignment +
    teamAlignment * categoryWeights.teamAlignment
  ) / 100;

  const overall = clampScore(weightedOverall);
  const delta = previousOverall ? overall - previousOverall : 0;

  return {
    reliability,
    maintainability,
    readability,
    architectureAlignment,
    teamAlignment,
    overall,
    previousOverall,
    delta,
    trendDirection: delta > 2 ? "improving" : delta < -2 ? "declining" : "stable",
  };
}
