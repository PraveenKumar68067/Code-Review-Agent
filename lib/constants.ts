export const severityValues = ["low", "medium", "high"] as const;
export const issueCategories = [
  "architecture",
  "validation",
  "reliability",
  "logging",
  "maintainability",
  "readability",
  "naming",
] as const;
export const scoreCategories = [
  "readability",
  "maintainability",
  "reliability",
  "architectureAlignment",
  "teamAlignment",
  "overall",
] as const;
export const userLevels = ["beginner", "intermediate", "advanced"] as const;

export const defaultArchitecturePreferences = [
  "Keep API route handlers thin.",
  "Move business logic into services.",
  "Separate controller, service, and repository responsibilities.",
  "Avoid database calls in UI or transport layers.",
  "Validate inputs before DB operations.",
  "Use structured logging for failures.",
  "Prefer reusable helper functions over duplication.",
  "Keep modules focused and small.",
  "Separate domain logic from transport logic.",
];

export const defaultTeamRules = [
  "Favor explicit validation at the edges.",
  "Use service functions for business rules.",
  "Avoid vague, generic review comments.",
  "Prefer reusable helpers over repeated validation logic.",
];

export const explanationStyles = {
  beginner: "Explain the mistake, why it matters, and show a safe fix.",
  intermediate: "Balance practical guidance with code-quality reasoning.",
  advanced: "Be concise and focus on architecture, maintainability, and trade-offs.",
} as const;
