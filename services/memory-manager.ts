import { feedbackActionSchema, memoryItemSchema, reviewHistoryEntrySchema, userHistorySchema, userProfileSchema, type FeedbackAction, type MemoryItem } from "@/lib/models";
import { makeId, keywordScore } from "@/lib/utils";
import { HindsightAdapter } from "@/services/hindsight-adapter";
import { StorageService } from "@/services/storage-service";

const DEFAULT_WORKSPACE_ID = "workspace-default";

function isGlobalRow(row: Record<string, any>) {
  return (row.scope ?? "global") === "global";
}

function isWorkspaceRow(row: Record<string, any>, workspaceId: string) {
  const scope = row.scope ?? "workspace";
  const rowWorkspaceId = row.workspaceId ?? DEFAULT_WORKSPACE_ID;
  return scope === "workspace" && rowWorkspaceId === workspaceId;
}

function sortByTimestamp<T extends Record<string, any>>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const leftTime = Date.parse(String(left.timestamp ?? 0));
    const rightTime = Date.parse(String(right.timestamp ?? 0));
    return leftTime - rightTime;
  });
}

export class MemoryManager {
  constructor(
    private storage = new StorageService(),
    private hindsight = new HindsightAdapter(),
  ) {}

  private async loadMemoryFile(filename: string) {
    const rows = await this.storage.readJson<Array<Record<string, any>>>(filename, []);
    return rows.map((row) => memoryItemSchema.parse(row));
  }

  private scoreMemory(text: string, item: MemoryItem) {
    return item.confidence + keywordScore(text, item.keywords) * 0.25 + Math.min(item.timesUsed * 0.01, 0.1);
  }

  async getRelevantMemories(codeText: string, language: string, userId?: string, workspaceId = DEFAULT_WORKSPACE_ID, topK = 8) {
    const [teamRules, commonMistakes, optimizationPatterns, feedbackHistory, userProfiles, codingHabits] = await Promise.all([
      this.loadMemoryFile("team-rules.json"),
      this.storage.readJson<Array<Record<string, any>>>("common-mistakes.json", []),
      this.storage.readJson<Array<Record<string, any>>>("optimization-patterns.json", []),
      this.storage.readJson<Array<Record<string, any>>>("feedback-history.json", []),
      this.storage.readJson<Array<Record<string, any>>>("user-profiles.json", []),
      this.storage.readJson<Array<Record<string, any>>>("coding-habits.json", []),
    ]);

    const sharedRules = teamRules.filter((item) => item.language === language);

    const workspaceMistakes = commonMistakes
      .filter((row) => isWorkspaceRow(row, workspaceId))
      .map((row) => memoryItemSchema.parse(row));

    const optimizationItems = optimizationPatterns
      .filter((row) => isWorkspaceRow(row, workspaceId))
      .map((row) =>
        memoryItemSchema.parse({
          id: row.id,
          kind: "optimization_pattern",
          title: row.pattern,
          content: row.evidence,
          scope: row.scope ?? "workspace",
          workspaceId: row.workspaceId ?? workspaceId,
          language: row.languages?.[0] ?? language,
          category: row.categories?.[0] ?? "maintainability",
          keywords: [...(row.categories ?? []), row.status].filter(Boolean),
          confidence: row.reuseConfidence,
          source: "optimization-history",
          timesUsed: 0,
          metadata: { status: row.status },
        }),
      );

    const feedbackItems = feedbackHistory
      .filter((row) => (!userId || row.userId === userId) && isWorkspaceRow(row, workspaceId))
      .map((row) =>
        memoryItemSchema.parse({
          id: row.feedbackId ?? makeId("feedback-memory"),
          kind: row.action === "accept_fix_pattern" ? "optimization_pattern" : "past_feedback",
          title:
            row.action === "not_helpful"
              ? `Rejected feedback: ${row.issueTitle}`
              : row.action === "accept_fix_pattern"
                ? `Accepted fix pattern: ${row.issueTitle}`
                : `Useful feedback: ${row.issueTitle}`,
          content: row.notes ?? row.issueTitle ?? "Past feedback",
          scope: "workspace",
          workspaceId,
          language,
          category: row.category ?? "readability",
          keywords: [row.category, row.issueTitle, row.action, ...(row.notes ? row.notes.split(/\W+/).slice(0, 6) : [])].filter(Boolean) as string[],
          confidence: row.action === "not_helpful" ? 0.75 : 0.9,
          source: "feedback-history",
          timesUsed: 0,
          metadata: { status: row.action, userId: row.userId ?? userId ?? "unknown" },
        }),
      );

    const profileItems = userProfiles
      .filter((row) => (!userId || row.userId === userId) && isWorkspaceRow(row, workspaceId))
      .flatMap((row) => {
        const items: MemoryItem[] = [];
        for (const weakArea of (row.weakAreas ?? []) as string[]) {
          items.push(
            memoryItemSchema.parse({
              id: `${row.userId}-${workspaceId}-${weakArea}`,
              kind: "developer_preference",
              title: `Known weak area: ${weakArea}`,
              content: `${row.name ?? "This developer"} has needed extra coaching around ${weakArea}.`,
              scope: "workspace",
              workspaceId,
              language: row.primaryLanguage ?? language,
              category: weakArea.includes("log") ? "logging" : weakArea.includes("error") ? "reliability" : weakArea.includes("arch") || weakArea.includes("route") ? "architecture" : "maintainability",
              keywords: [weakArea, ...(row.focusAreas ?? [])],
              confidence: 0.82,
              source: "user-profile",
              timesUsed: 0,
              metadata: { team: row.team ?? "unknown" },
            }),
          );
        }
        return items;
      });

    const habitItems = codingHabits
      .filter((row) => (!userId || row.userId === userId) && isWorkspaceRow(row, workspaceId))
      .map((row) =>
        memoryItemSchema.parse({
          id: `${row.userId}-${workspaceId}-${row.habitType}`,
          kind: "coding_habit",
          title: `Habit trend: ${row.habitType}`,
          content: row.evidence ?? `Historical habit signal for ${row.habitType}.`,
          scope: "workspace",
          workspaceId,
          language,
          category: row.habitType === "error_handling" ? "reliability" : row.habitType,
          keywords: [row.habitType, row.trend].filter(Boolean),
          confidence: 0.8,
          source: "coding-habits",
          timesUsed: 0,
          metadata: { trend: row.trend, score: row.score },
        }),
      );

    const localMatches = [...sharedRules, ...workspaceMistakes, ...optimizationItems, ...feedbackItems, ...profileItems, ...habitItems]
      .filter((item) => item.language === language)
      .filter((item) => this.scoreMemory(codeText, item) >= 0.9)
      .sort((a, b) => this.scoreMemory(codeText, b) - this.scoreMemory(codeText, a));

    const remote = await this.hindsight.retrieve({ query: `${workspaceId} ${codeText.slice(0, 400)}`, language, topK });
    const remoteItems = remote.map((item, index) =>
      memoryItemSchema.parse({
        id: item.id ?? `hindsight-${index}`,
        kind: item.kind ?? "past_feedback",
        title: item.title ?? "Hindsight memory",
        content: item.content ?? "",
        scope: item.scope ?? "workspace",
        workspaceId: item.workspaceId ?? workspaceId,
        language: item.language ?? language,
        category: item.category ?? "architecture",
        keywords: item.keywords ?? [],
        confidence: item.confidence ?? 0.8,
        source: "hindsight",
        timesUsed: item.timesUsed ?? 0,
        metadata: item.metadata ?? {},
      }),
    );

    return [...localMatches, ...remoteItems.filter((item) => item.scope === "global" || item.workspaceId === workspaceId)].slice(0, topK);
  }

  async getSimilarPastIssues(codeText: string, language: string, workspaceId = DEFAULT_WORKSPACE_ID, topK = 5) {
    const reviews = await this.storage.readJson<Array<Record<string, any>>>("past-reviews.json", []);
    const text = codeText.toLowerCase();
    const matches: Array<Record<string, any>> = [];

    for (const review of reviews) {
      if (review.language !== language || !isWorkspaceRow(review, workspaceId)) continue;
      for (const issue of review.issues ?? []) {
        const score = (issue.keywords ?? []).reduce(
          (count: number, keyword: string) => count + (text.includes(keyword.toLowerCase()) ? 1 : 0),
          0,
        );
        if (score > 0) {
          matches.push({
            reviewId: review.reviewId,
            title: issue.title,
            category: issue.category,
            severity: issue.severity,
            status: issue.status,
            score,
          });
        }
      }
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async getUserHistory(userId: string, workspaceId = DEFAULT_WORKSPACE_ID) {
    const [profiles, reviews, feedback, trends, habits] = await Promise.all([
      this.storage.readJson<Array<Record<string, any>>>("user-profiles.json", []),
      this.storage.readJson<Array<Record<string, any>>>("past-reviews.json", []),
      this.storage.readJson<Array<Record<string, any>>>("feedback-history.json", []),
      this.storage.readJson<Array<Record<string, any>>>("trend-history.json", []),
      this.storage.readJson<Array<Record<string, any>>>("coding-habits.json", []),
    ]);

    const profile = profiles.find((row) => row.userId === userId && isWorkspaceRow(row, workspaceId));
    const workspaceReviews = sortByTimestamp(
      reviews
        .filter((row) => row.userId === userId && isWorkspaceRow(row, workspaceId))
        .map((row) =>
          reviewHistoryEntrySchema.parse({
            ...row,
            workspaceId: row.workspaceId ?? workspaceId,
            issueCount: row.issueCount ?? row.issues?.length ?? 0,
            scores: {
              ...(row.scores ?? {}),
              architectureAlignment: row.scores?.architectureAlignment ?? row.scores?.architecture ?? 0,
              reliability: row.scores?.reliability ?? 0,
              maintainability: row.scores?.maintainability ?? 0,
              readability: row.scores?.readability ?? 0,
              teamAlignment: row.scores?.teamAlignment ?? 0,
              overall: row.scores?.overall ?? 0,
            },
          }),
        ),
    );

    return userHistorySchema.parse({
      workspaceId,
      profile: profile ? userProfileSchema.parse(profile) : null,
      reviews: workspaceReviews,
      feedback: sortByTimestamp(feedback.filter((row) => row.userId === userId && isWorkspaceRow(row, workspaceId))),
      trends: sortByTimestamp(trends.filter((row) => row.userId === userId && isWorkspaceRow(row, workspaceId))),
      habits: habits.filter((row) => row.userId === userId && isWorkspaceRow(row, workspaceId)),
    });
  }

  async getTeamPreferences(language = "python") {
    const items = await this.loadMemoryFile("team-rules.json");
    return items.filter((item) => item.language === language && ["team_rule", "architecture_preference"].includes(item.kind));
  }

  async saveFeedback(input: FeedbackAction) {
    const feedback = feedbackActionSchema.parse({
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString(),
    });
    const row = {
      feedbackId: makeId("fb"),
      scope: "workspace",
      workspaceId: feedback.workspaceId,
      userId: feedback.userId,
      issueTitle: feedback.issueTitle,
      action: feedback.action,
      category: feedback.category,
      language: feedback.language ?? "python",
      timestamp: feedback.timestamp,
      notes: feedback.notes ?? "",
    };
    await this.storage.appendJsonItem("feedback-history.json", row);
    await this.hindsight.save(row);
    return row;
  }

  async saveTeamRule(title: string, content: string, language: string, category: string) {
    const row = {
      id: makeId("rule"),
      kind: "team_rule",
      scope: "global",
      title,
      content,
      language,
      category,
      keywords: [category, ...title.toLowerCase().split(/\s+/).slice(0, 3)],
      confidence: 0.9,
      source: "user-feedback",
      timesUsed: 1,
      metadata: { createdAt: new Date().toISOString() },
    };
    const current = await this.storage.readJson<Array<Record<string, any>>>("team-rules.json", []);
    current.push(row);
    await this.storage.writeJson("team-rules.json", current);
    await this.hindsight.save(row);
    return row;
  }

  async saveCommonMistake(title: string, content: string, language: string, category: string, workspaceId = DEFAULT_WORKSPACE_ID) {
    const row = {
      id: makeId("mistake"),
      kind: "common_mistake",
      scope: "workspace",
      workspaceId,
      title,
      content,
      language,
      category,
      keywords: [category, ...title.toLowerCase().split(/\s+/).slice(0, 3)],
      confidence: 0.88,
      source: "user-feedback",
      timesUsed: 1,
      metadata: { createdAt: new Date().toISOString() },
    };
    const current = await this.storage.readJson<Array<Record<string, any>>>("common-mistakes.json", []);
    current.push(row);
    await this.storage.writeJson("common-mistakes.json", current);
    await this.hindsight.save(row);
    return row;
  }

  async saveArchitecturePreference(title: string, content: string, language: string) {
    const row = {
      id: makeId("arch"),
      kind: "architecture_preference",
      scope: "global",
      title,
      content,
      language,
      category: "architecture",
      keywords: ["architecture", ...title.toLowerCase().split(/\s+/).slice(0, 3)],
      confidence: 0.92,
      source: "user-feedback",
      timesUsed: 1,
      metadata: { createdAt: new Date().toISOString() },
    };
    const current = await this.storage.readJson<Array<Record<string, any>>>("team-rules.json", []);
    current.push(row);
    await this.storage.writeJson("team-rules.json", current);
    await this.hindsight.save(row);
    return row;
  }

  async saveReviewHistory(reviewResult: Record<string, unknown>) {
    const current = await this.storage.readJson<Array<Record<string, any>>>("past-reviews.json", []);
    current.push(reviewResult);
    await this.storage.writeJson("past-reviews.json", current);
  }

  async updateUserTrends(userId: string, workspaceId: string, scores: Record<string, number>) {
    const current = await this.storage.readJson<Array<Record<string, any>>>("trend-history.json", []);
    current.push({ scope: "workspace", workspaceId, userId, timestamp: new Date().toISOString(), ...scores });
    await this.storage.writeJson("trend-history.json", current);
  }

  async updateCodingHabits(userId: string, workspaceId: string, issues: Array<{ category: string }>) {
    const counter = new Map<string, number>();
    for (const issue of issues) {
      counter.set(issue.category, (counter.get(issue.category) ?? 0) + 1);
    }

    const current = await this.storage.readJson<Array<Record<string, any>>>("coding-habits.json", []);
    const filtered = current.filter((row) => !(row.userId === userId && isWorkspaceRow(row, workspaceId)));

    const habitMap = [
      ["validation", "validation"],
      ["error_handling", "reliability"],
      ["architecture", "architecture"],
      ["logging", "logging"],
      ["maintainability", "maintainability"],
    ] as const;

    for (const [habitType, category] of habitMap) {
      const count = counter.get(category) ?? 0;
      filtered.push({
        scope: "workspace",
        workspaceId,
        userId,
        habitType,
        trend: count === 0 ? "improving" : "watch",
        evidence: `Recent review generated ${count} issue(s) for ${habitType}.`,
        score: Math.max(35, 80 - count * 10),
      });
    }

    await this.storage.writeJson("coding-habits.json", filtered);
  }
}
