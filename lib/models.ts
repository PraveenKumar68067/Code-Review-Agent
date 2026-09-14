import { z } from "zod";

import { issueCategories, severityValues, userLevels } from "@/lib/constants";

export const severitySchema = z.enum(severityValues);
export const categorySchema = z.enum(issueCategories);
export const userLevelSchema = z.enum(userLevels);

export const memoryItemSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  content: z.string(),
  scope: z.enum(["global", "workspace"]).default("workspace"),
  workspaceId: z.string().optional(),
  language: z.string(),
  category: z.string(),
  keywords: z.array(z.string()).default([]),
  confidence: z.number().default(0.5),
  source: z.string().default("local"),
  timesUsed: z.number().default(0),
  metadata: z.record(z.any()).default({}),
});

export const reviewIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: severitySchema,
  category: categorySchema,
  explanation: z.string(),
  whyItMatters: z.string(),
  suggestion: z.string(),
  fixExample: z.string().default(""),
  architectureGuidance: z.string().default(""),
  learningNote: z.string().default(""),
  similarFixPattern: z.string().default(""),
  memoryUsed: z.array(z.string()).default([]),
  repeatedIssue: z.boolean().default(false),
  similarPastIssue: z.boolean().default(false),
  architectureMatch: z.boolean().default(false),
  seenBefore: z.boolean().default(false),
});

export const improvementItemSchema = z.object({
  title: z.string(),
  detail: z.string(),
  direction: z.enum(["up", "flat", "down"]).default("flat"),
});

export const reusableFixPatternSchema = z.object({
  title: z.string(),
  category: z.string(),
  applyWhen: z.string(),
  reusablePattern: z.string(),
  source: z.string(),
});

export const parserAnalysisSchema = z.object({
  language: z.string(),
  routeHandlers: z.number(),
  hasBusinessLogicInRoute: z.boolean(),
  hasDbCalls: z.boolean(),
  hasValidation: z.boolean(),
  hasTryCatch: z.boolean(),
  longFunctions: z.array(z.string()),
  duplicateLogicClues: z.array(z.string()),
  hasLogging: z.boolean(),
  namingSmells: z.array(z.string()),
  architectureSmells: z.array(z.string()),
  diffMode: z.boolean().default(false),
  rawSignals: z.record(z.any()).default({}),
});

export const scoreBreakdownSchema = z.object({
  readability: z.number(),
  maintainability: z.number(),
  reliability: z.number(),
  architectureAlignment: z.number(),
  teamAlignment: z.number(),
  overall: z.number(),
  previousOverall: z.number().default(0),
  delta: z.number().default(0),
  trendDirection: z.enum(["improving", "stable", "declining"]).default("stable"),
});

export const trendSummarySchema = z.object({
  summaryLines: z.array(z.string()),
  repeatedIssueTypes: z.array(z.string()),
  strengthAreas: z.array(z.string()),
  weakAreas: z.array(z.string()),
  architectureTrend: z.string(),
  scoreDirection: z.enum(["improving", "stable", "declining"]),
});

export const habitProfileSchema = z.object({
  strengths: z.array(z.string()),
  weakHabits: z.array(z.string()),
  repeatedPatterns: z.array(z.string()),
  coachSuggestions: z.array(z.string()),
  habitScores: z.record(z.number()),
});

export const userProfileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  level: userLevelSchema,
  primaryLanguage: z.string(),
  preferredFeedbackStyle: z.string(),
  team: z.string(),
  focusAreas: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  weakAreas: z.array(z.string()).default([]),
});

export const reviewHistoryEntrySchema = z.object({
  reviewId: z.string(),
  scope: z.enum(["global", "workspace"]).default("workspace"),
  workspaceId: z.string().default("workspace-default"),
  userId: z.string(),
  timestamp: z.string(),
  language: z.string(),
  summary: z.string(),
  issueCount: z.number().default(0),
  issues: z.array(z.record(z.any())).default([]),
  scores: scoreBreakdownSchema.pick({
    reliability: true,
    maintainability: true,
    readability: true,
    architectureAlignment: true,
    teamAlignment: true,
    overall: true,
  }),
});

export const userHistorySchema = z.object({
  workspaceId: z.string().default("workspace-default"),
  profile: userProfileSchema.nullable(),
  reviews: z.array(reviewHistoryEntrySchema),
  feedback: z.array(z.record(z.any())),
  trends: z.array(z.record(z.any())),
  habits: z.array(z.record(z.any())),
});

export const feedbackActionSchema = z.object({
  issueId: z.string(),
  issueTitle: z.string(),
  action: z.string(),
  category: z.string(),
  userId: z.string(),
  workspaceId: z.string().default("workspace-default"),
  language: z.string().optional(),
  timestamp: z.string().optional(),
  notes: z.string().optional(),
});

export const reviewResultSchema = z.object({
  reviewId: z.string(),
  userId: z.string(),
  workspaceId: z.string().default("workspace-default"),
  language: z.string(),
  userLevel: userLevelSchema,
  memoryEnabled: z.boolean(),
  issues: z.array(reviewIssueSchema),
  scores: scoreBreakdownSchema,
  trendSummary: trendSummarySchema,
  habitProfile: habitProfileSchema,
  memoriesUsed: z.array(memoryItemSchema),
  similarPastIssues: z.array(z.record(z.any())),
  analysis: parserAnalysisSchema,
  memoryHighlights: z.array(improvementItemSchema).default([]),
  improvementSinceLastReview: z.array(improvementItemSchema).default([]),
  repeatedMistakes: z.array(improvementItemSchema).default([]),
  reusableFixPatterns: z.array(reusableFixPatternSchema).default([]),
  comparisonLabel: z.string().default(""),
});

export type MemoryItem = z.infer<typeof memoryItemSchema>;
export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type ParserAnalysis = z.infer<typeof parserAnalysisSchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type ReviewHistoryEntry = z.infer<typeof reviewHistoryEntrySchema>;
export type TrendSummary = z.infer<typeof trendSummarySchema>;
export type HabitProfile = z.infer<typeof habitProfileSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type FeedbackAction = z.infer<typeof feedbackActionSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ImprovementItem = z.infer<typeof improvementItemSchema>;
export type ReusableFixPattern = z.infer<typeof reusableFixPatternSchema>;
export type UserHistory = z.infer<typeof userHistorySchema>;

export const reviewRequestSchema = z.object({
  code: z.string().default(""),
  diff: z.string().default(""),
  language: z.string().default("python"),
  userLevel: userLevelSchema.default("intermediate"),
  memoryEnabled: z.boolean().default(true),
  userId: z.string().default("demo_user"),
  workspaceId: z.string().default("workspace-default"),
  persist: z.boolean().default(true),
});
