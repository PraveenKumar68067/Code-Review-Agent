import { generateFixExample } from "@/lib/fixer";
import type { HabitProfile, MemoryItem, ParserAnalysis, ReviewIssue, TrendSummary } from "@/lib/models";
import { makeId } from "@/lib/utils";

function styleText(userLevel: string, short: string, medium: string, deep: string) {
  if (userLevel === "beginner") {
    return `Beginner coaching: ${deep} What this means in practice: start with the safest small refactor, then re-run the review to confirm the issue disappears.`;
  }
  if (userLevel === "intermediate") {
    return `Intermediate guidance: ${medium} Recommended next move: use one focused refactor that improves code quality without changing behavior.`;
  }
  return `Advanced review: ${short} Priority: address the structural risk with a targeted refactor rather than surface cleanup.`;
}

function matchingMemoryTitles(memories: MemoryItem[], category: string) {
  return memories.filter((item) => item.category === category).slice(0, 3).map((item) => item.title);
}

function matchingMemories(memories: MemoryItem[], category: string) {
  return memories.filter((item) => item.category === category);
}

function acceptedMemoryTitles(memories: MemoryItem[], category: string) {
  return memories
    .filter((item) => {
      if (item.category !== category) return false;
      const status = `${item.metadata?.status ?? ""}`.toLowerCase();
      return status.includes("accept") || status.includes("helpful");
    })
    .slice(0, 2)
    .map((item) => item.title);
}

function rejectedMemoryTitles(memories: MemoryItem[], category: string) {
  return memories
    .filter((item) => item.category === category && `${item.metadata?.status ?? ""}`.includes("reject"))
    .slice(0, 2)
    .map((item) => item.title);
}

function similarIssueCount(similarPastIssues: Array<Record<string, any>>, category: string) {
  return similarPastIssues.filter((item) => item.category === category).length;
}

function buildMemoryAttribution(memories: MemoryItem[], category: string, architectureMatch?: boolean) {
  const matched = matchingMemories(memories, category);
  const labels = matched.map((item) => item.title);

  if (architectureMatch) {
    const architectureMemory = memories
      .filter((item) => item.category === "architecture")
      .slice(0, 2)
      .map((item) => item.title);
    labels.push(...architectureMemory);
  }

  return Array.from(new Set(labels)).slice(0, 5);
}

export function buildReviewIssues(input: {
  codeText: string;
  analysis: ParserAnalysis;
  userLevel: "beginner" | "intermediate" | "advanced";
  memoryEnabled: boolean;
  relevantMemories: MemoryItem[];
  similarPastIssues: Array<Record<string, any>>;
  trendSummary: TrendSummary;
  habitProfile: HabitProfile;
}): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const repeatedCategories = new Set(input.trendSummary.repeatedIssueTypes);
  const similarCategories = new Set(input.similarPastIssues.map((item) => item.category));

  const addIssue = (params: {
    title: string;
    severity: ReviewIssue["severity"];
    category: ReviewIssue["category"];
    short: string;
    medium: string;
    deep: string;
    whyItMatters: string;
    suggestion: string;
    architectureGuidance?: string;
    learningNote?: string;
    similarFixPattern?: string;
    architectureMatch?: boolean;
  }) => {
    const memoryUsed = input.memoryEnabled ? buildMemoryAttribution(input.relevantMemories, params.category, params.architectureMatch) : [];
    const acceptedPatterns = input.memoryEnabled ? acceptedMemoryTitles(input.relevantMemories, params.category) : [];
    const rejectedPatterns = input.memoryEnabled ? rejectedMemoryTitles(input.relevantMemories, params.category) : [];
    const repeatedCount = similarIssueCount(input.similarPastIssues, params.category);

    let explanation = styleText(input.userLevel, params.short, params.medium, params.deep);

    if (input.memoryEnabled && memoryUsed.length > 0) {
      explanation += ` Team memory matched: ${memoryUsed.join(", ")}.`;
    }
    if (input.memoryEnabled && repeatedCategories.has(params.category)) {
      explanation += " This issue family has shown up repeatedly in recent review history.";
    }
    if (input.memoryEnabled && similarCategories.has(params.category)) {
      explanation += repeatedCount > 0
        ? ` Similar history match: this category appeared ${repeatedCount} time(s) in prior reviews.`
        : " A similar issue was found in prior review history.";
    }
    if (input.memoryEnabled && acceptedPatterns.length > 0) {
      explanation += ` Accepted feedback reused: ${acceptedPatterns.join(", ")}.`;
    }
    if (input.memoryEnabled && rejectedPatterns.length > 0) {
      explanation += ` Rejected feedback avoided: ${rejectedPatterns.join(", ")} was intentionally not repeated as generic advice.`;
    }
    if (!input.memoryEnabled) {
      explanation += " This baseline review is intentionally generic and does not use team history, accepted fixes, or prior review context.";
    }
    if (!input.habitProfile.weakHabits.includes(params.category) && params.category === "validation" && input.memoryEnabled) {
      explanation += " This is also an area where recent work shows improvement, so keeping the momentum matters.";
    }

    let suggestion = params.suggestion;
    if (input.memoryEnabled && acceptedPatterns.length > 0) {
      suggestion += ` Recommended pattern to reuse: ${acceptedPatterns.join(", ")}.`;
    }
    if (!input.memoryEnabled) {
      suggestion = `Generic suggestion: ${params.suggestion}`;
    }

    issues.push({
      id: makeId("issue"),
      title: params.title,
      severity: params.severity,
      category: params.category,
      explanation,
      whyItMatters: params.whyItMatters,
      suggestion,
      fixExample: generateFixExample(params.category),
      architectureGuidance: params.architectureGuidance ?? "",
      learningNote: params.learningNote ?? "",
      similarFixPattern: params.similarFixPattern ?? "",
      memoryUsed,
      repeatedIssue: repeatedCategories.has(params.category),
      similarPastIssue: similarCategories.has(params.category),
      architectureMatch: params.architectureMatch ?? false,
      seenBefore: repeatedCategories.has(params.category) || similarCategories.has(params.category),
    });
  };

  if (input.analysis.hasBusinessLogicInRoute) {
    const architectureMemory = matchingMemoryTitles(input.relevantMemories, "architecture");
    const acceptedArchitecturePatterns = acceptedMemoryTitles(input.relevantMemories, "architecture");
    let suggestion =
      "Move calculation and persistence flow into a service function so the route only validates, delegates, and formats the response.";
    if (input.memoryEnabled && acceptedArchitecturePatterns.length > 0) {
      suggestion += ` This matches an accepted team pattern: ${acceptedArchitecturePatterns.join(", ")}.`;
    }
    addIssue({
      title: "Thin down the route handler",
      severity: "high",
      category: "architecture",
      short: "The route appears to own business rules and persistence orchestration.",
      medium: "The route handler is doing more than transport work. It calculates totals, touches persistence, and controls business flow in one place.",
      deep: "This route is carrying business logic that would be easier to test and reuse inside a service layer. Keeping handlers thin also makes validation and failures easier to reason about.",
      whyItMatters: "Mixing controller and domain logic makes the endpoint harder to test, reuse, and align with the team's service-layer architecture.",
      suggestion,
      architectureGuidance: input.memoryEnabled && architectureMemory.length > 0
        ? `Matched architecture memory: ${architectureMemory.join(", ")}. Keep route handlers thin, move domain logic into a service, and keep repository access behind that service boundary.`
        : "Generic architecture guidance: keep route handlers focused on request/response work and move business rules into a service.",
      learningNote:
        input.userLevel === "beginner"
          ? "Begin with one safe extraction such as `create_order_service(payload)` so the route becomes validate -> delegate -> respond."
          : input.userLevel === "intermediate"
            ? "A strong next step is controller -> service -> repository separation, with validation at the edge."
            : "This should be a transport/domain separation refactor, not an inline cleanup inside the handler.",
      similarFixPattern: input.memoryEnabled
        ? "Reusable pattern: route validates input, service owns pricing rules, repository persists the final order, response layer only formats output."
        : "Reusable pattern: extract service layer for business logic and keep route handlers thin.",
      architectureMatch: true,
    });
  }

  if (input.analysis.hasDbCalls && !input.analysis.hasValidation) {
    const validationMemory = matchingMemoryTitles(input.relevantMemories, "validation");
    let suggestion =
      "Add a small validation block or helper before any repository or database call. Check required fields, types, and obvious business constraints first.";
    if (input.memoryEnabled) {
      suggestion += " This lines up with the team rule to validate before DB work.";
    }
    addIssue({
      title: "Validate inputs before persistence work",
      severity: "high",
      category: "validation",
      short: "Database work is happening before clear request validation.",
      medium: "The code uses request data before checking required fields, value ranges, or allowed states.",
      deep: "Using payload values directly can create runtime errors or bad writes. A clear validation gate helps reject malformed requests early and keeps later logic simpler.",
      whyItMatters: "Early validation prevents bad writes, lowers debugging cost, and aligns with the team's fail-fast standard.",
      suggestion,
      architectureGuidance: input.memoryEnabled && validationMemory.length > 0
        ? `Matched validation memory: ${validationMemory.join(", ")}. Validate request payloads before calling repositories or databases.`
        : "Generic guidance: validate request payloads before repository or database work.",
      learningNote:
        input.userLevel === "beginner"
          ? "Think of validation as the front door of the function: bad input should stop there before anything is saved."
          : input.userLevel === "intermediate"
            ? "Pull validation into a helper if the same checks will appear in more than one handler."
            : "Prefer a boundary-validation abstraction so validation rules do not drift across endpoints.",
      similarFixPattern: input.memoryEnabled
        ? "Reusable pattern: edge validation helper + early return before DB operations + typed normalized payload."
        : "Reusable pattern: validate required fields before touching persistence.",
    });
  }

  if ((input.analysis.hasDbCalls || input.codeText.includes("client.")) && !input.analysis.hasTryCatch) {
    let suggestion =
      "Wrap the risky operation in a small try/except or try/catch block and log structured context before returning an appropriate error response.";
    if (input.memoryEnabled && input.relevantMemories.some((memory) => memory.category === "logging")) {
      suggestion += " Prior feedback also showed that structured failure logging was useful for this team.";
    }
    addIssue({
      title: "Protect external operations with error handling",
      severity: "high",
      category: "reliability",
      short: "External or persistence calls run without safe failure handling.",
      medium: "Database or client operations appear to run without explicit error handling or a clear fallback path.",
      deep: "When repository or external calls fail, the current code path can leak exceptions without context. Adding error handling keeps incidents easier to diagnose and responses safer for callers.",
      whyItMatters: "Unhandled failures reduce reliability and make production triage slower.",
      suggestion,
      architectureGuidance: input.memoryEnabled
        ? "Team preference: external operations should have a controlled failure path plus structured logs."
        : "Generic reliability guidance: risky operations should fail predictably and surface actionable logs.",
      learningNote:
        input.userLevel === "beginner"
          ? "Wrap only the risky call first, then log what failed and return a safe error."
          : input.userLevel === "intermediate"
            ? "Use one shared error-handling pattern so repo and client calls fail consistently."
            : "Treat this as an operational contract: predictable failures, structured logs, and no hidden exception leaks.",
      similarFixPattern: input.memoryEnabled
        ? "Reusable pattern: guarded external call + structured log + safe fallback response + team-standard error payload."
        : "Reusable pattern: guarded external call + safe fallback response.",
    });
  }

  if (input.analysis.duplicateLogicClues.length > 0) {
    const acceptedMaintainabilityPatterns = acceptedMemoryTitles(input.relevantMemories, "maintainability");
    addIssue({
      title: "Extract duplicated logic into a helper",
      severity: "medium",
      category: "maintainability",
      short: "Very similar logic appears more than once.",
      medium: "The same calculation or branch pattern shows up in multiple places, which will make future fixes easy to miss.",
      deep: "Duplicate business rules drift over time because teams update one copy and forget the other. A shared helper or service keeps behavior consistent and shortens future changes.",
      whyItMatters: "Duplication drives regression risk and slows down feature changes.",
      suggestion: input.memoryEnabled && acceptedMaintainabilityPatterns.length > 0
        ? `Create one shared helper for the repeated logic and reuse the accepted pattern: ${acceptedMaintainabilityPatterns.join(", ")}.`
        : "Create one shared helper for the repeated logic and call it from both paths.",
      architectureGuidance: input.memoryEnabled
        ? "Team preference: reusable helper or service functions instead of duplicated rule logic."
        : "Generic maintainability guidance: shared rules should live in one helper.",
      learningNote:
        input.userLevel === "advanced"
          ? "Extract the shared rule at the domain boundary, not as a random utility."
          : "If two functions do nearly the same thing, move that logic into one shared helper.",
      similarFixPattern: input.memoryEnabled
        ? "Reusable pattern: extract helper/service for repeated validation or pricing logic, then reuse the helper from each handler."
        : "Reusable pattern: extract a shared helper for duplicated logic.",
    });
  }

  if (!input.analysis.hasLogging && (input.analysis.hasDbCalls || input.codeText.includes("client."))) {
    const loggingMemory = matchingMemoryTitles(input.relevantMemories, "logging");
    addIssue({
      title: "Add structured logging around important operations",
      severity: "medium",
      category: "logging",
      short: "Important operations do not have clear structured logs.",
      medium: "The code performs persistence or external work without logging contextual fields for success or failure paths.",
      deep: "When incidents happen, structured logs with identifiers like request id or invoice id make failures much faster to trace than plain prints or silence.",
      whyItMatters: "Logging is part of the team's production-readiness standard and helps incident response.",
      suggestion: input.memoryEnabled
        ? "Use structured logging and include operation-specific context, especially on error paths. Reuse the team's preferred failure-log shape."
        : "Add structured logging with operation-specific context, especially on error paths.",
      architectureGuidance: input.memoryEnabled && loggingMemory.length > 0
        ? `Matched logging memory: ${loggingMemory.join(", ")}. Use structured logs with operation context instead of raw prints.`
        : "Generic logging guidance: prefer structured logs with operation context instead of raw prints.",
      learningNote:
        input.userLevel === "beginner"
          ? "Replace `print` with a logger and include one useful identifier like `invoice_id`."
          : input.userLevel === "intermediate"
            ? "Add logs at the failure path first, then standardize fields across similar flows."
            : "Logging should follow the same operational schema used by the rest of the service.",
      similarFixPattern: input.memoryEnabled
        ? "Reusable pattern: operation-scoped logger fields on success and failure paths using the team's structured logging format."
        : "Reusable pattern: add operation-scoped logs on failure paths.",
    });
  }

  for (const smell of input.analysis.namingSmells) {
    const rejectedGenericNaming = input.relevantMemories.some(
      (memory) => memory.metadata?.status === "rejected" && memory.category === "naming",
    );
    addIssue({
      title: "Clarify naming where intent is hidden",
      severity: "low",
      category: "naming",
      short: smell,
      medium: smell,
      deep: `${smell} Clear naming lowers review friction and helps new contributors read the flow correctly.`,
      whyItMatters: "Intent-revealing names improve readability and reduce confusion during maintenance.",
      suggestion: rejectedGenericNaming && input.memoryEnabled
        ? "Tighten naming only where the variable hides domain intent, and include a concrete rename example instead of broad style advice."
        : "Rename generic variables to reflect their domain meaning.",
      learningNote:
        input.userLevel === "beginner"
          ? "A good name should answer 'what is this value for?' without reading the whole function."
          : input.userLevel === "advanced"
            ? "Keep naming comments grounded in domain ambiguity, not generic style cleanup."
            : "Rename only where intent is unclear or naming conflicts with team conventions.",
    });
  }

  for (const functionName of input.analysis.longFunctions.slice(0, 1)) {
    addIssue({
      title: `Split long function \`${functionName}\` into smaller steps`,
      severity: "medium",
      category: "maintainability",
      short: `\`${functionName}\` is carrying several responsibilities.`,
      medium: `\`${functionName}\` is long enough that validation, orchestration, and domain logic are blending together.`,
      deep: `\`${functionName}\` is long enough to hide important branches. Breaking it into focused helpers makes testing and future edits safer.`,
      whyItMatters: "Smaller functions improve readability and make code review faster.",
      suggestion: "Extract validation, domain calculation, and side effects into separate helpers or services.",
      architectureGuidance: input.memoryEnabled
        ? "Team preference: keep modules focused and functions small enough to review in one pass."
        : "Generic maintainability guidance: split long functions by responsibility.",
      learningNote:
        input.userLevel === "beginner"
          ? "A simple split is input checks, business rule step, then side effects."
          : "Split by responsibility, not by arbitrary line count.",
      similarFixPattern: input.memoryEnabled
        ? "Reusable pattern: function split into validation, orchestration, and side-effect helpers that mirror the team architecture."
        : "Reusable pattern: split one long function into focused helpers.",
    });
  }

  if (issues.length === 0) {
    issues.push({
      id: makeId("issue"),
      title: "No major issues detected by the deterministic review engine",
      severity: "low",
      category: "readability",
      explanation: styleText(
        input.userLevel,
        "The code looks broadly healthy under the current heuristic checks.",
        "The current heuristic review did not find any high-signal issues. A real team review would still inspect tests, edge cases, and domain assumptions.",
        "Heuristic review found no major issues. Remaining risk is likely in business rules or missing tests rather than the structure itself.",
      ),
      whyItMatters: "A clean heuristic pass suggests the main value now is validating behavior rather than syntax or structure.",
      suggestion: "Consider adding tests or supplying a PR diff for deeper context.",
      fixExample: "",
      architectureGuidance: "",
      learningNote: "",
      similarFixPattern: "",
      memoryUsed: [],
      repeatedIssue: false,
      similarPastIssue: false,
      architectureMatch: false,
      seenBefore: false,
    });
  }

  return issues;
}
