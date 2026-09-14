import { parserAnalysisSchema, type ParserAnalysis } from "@/lib/models";

const routePatterns = [/@.*route/i, /APIRouter/i, /Blueprint/i, /router\.(get|post|put|delete)/i];
const dbPatterns = [/execute\(/i, /commit\(/i, /session\./i, /repo\./i, /find_by_/i, /insert\(/i];
const loggingPatterns = [/\blogging\./i, /\blogger\./i, /\bprint\(/i];
const validationPatterns = [/if\s+["']\w+["']\s+not\s+in/i, /validate/i, /schema/i, /pydantic/i, /assert /i];

function extractFunctionBlocks(code: string) {
  const blocks: Array<{ name: string; lines: string[] }> = [];
  let currentName = "";
  let currentLines: string[] = [];

  for (const line of code.split("\n")) {
    const match = line.match(/^\s*(def|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (match) {
      if (currentName) {
        blocks.push({ name: currentName, lines: currentLines });
      }
      currentName = match[2];
      currentLines = [line];
      continue;
    }
    if (currentName) {
      currentLines.push(line);
    }
  }

  if (currentName) {
    blocks.push({ name: currentName, lines: currentLines });
  }
  return blocks;
}

function findDuplicateLogic(code: string) {
  const normalized = code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const counts = new Map<string, number>();

  for (const line of normalized) {
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([line, count]) => count > 1 && line.length > 18)
    .slice(0, 5)
    .map(([line]) => line);
}

function findNamingSmells(code: string) {
  const smells: string[] = [];
  if (/\b(data|obj|temp|value)\b/.test(code)) {
    smells.push("Generic variable names reduce intent clarity.");
  }
  if (/\b[a-z]+[A-Z][a-zA-Z]*\b/.test(code) && /\b[a-z]+_[a-z]+\b/.test(code)) {
    smells.push("Naming style is inconsistent across variables or functions.");
  }
  return smells;
}

export function parseCode(codeText: string, language = "python", diffText = ""): ParserAnalysis {
  const combined = `${codeText}\n${diffText}`.trim();
  const routeHandlers = routePatterns.filter((pattern) => pattern.test(combined)).length;
  const hasDbCalls = dbPatterns.some((pattern) => pattern.test(combined));
  const hasLogging = loggingPatterns.some((pattern) => pattern.test(combined));
  const hasValidation = validationPatterns.some((pattern) => pattern.test(combined));
  const hasTryCatch =
    (combined.includes("try:") && combined.includes("except")) ||
    (combined.includes("try {") && combined.includes("catch"));

  const longFunctions = extractFunctionBlocks(codeText)
    .filter((block) => block.lines.filter((line) => line.trim()).length >= 12)
    .map((block) => block.name);

  const duplicateLogicClues = findDuplicateLogic(codeText);
  const namingSmells = findNamingSmells(codeText);
  const architectureSmells: string[] = [];

  let hasBusinessLogicInRoute = false;
  if (routeHandlers > 0 && hasDbCalls && (combined.includes("for ") || combined.includes("if "))) {
    hasBusinessLogicInRoute = true;
    architectureSmells.push("Route handlers appear to mix control flow, persistence, and business logic.");
  }
  if ((combined.includes("repo.") || combined.includes("execute(")) && (combined.includes("Controller") || routeHandlers > 0)) {
    architectureSmells.push("Transport layer appears to call repositories directly.");
    if (routeHandlers > 0) {
      hasBusinessLogicInRoute = true;
    }
  }
  if (duplicateLogicClues.length > 0) {
    architectureSmells.push("Similar logic appears in multiple places instead of shared helpers.");
  }
  if (!hasLogging && (hasDbCalls || combined.includes("client."))) {
    architectureSmells.push("External operations occur without visible logging.");
  }

  return parserAnalysisSchema.parse({
    language,
    routeHandlers,
    hasBusinessLogicInRoute,
    hasDbCalls,
    hasValidation,
    hasTryCatch,
    longFunctions,
    duplicateLogicClues,
    hasLogging,
    namingSmells,
    architectureSmells,
    diffMode: Boolean(diffText.trim()),
    rawSignals: {
      lineCount: combined.split("\n").length,
      printCalls: (combined.match(/print\(/g) ?? []).length,
      dbCallCount: ["execute(", "repo.", "session.", "commit("].reduce(
        (count, token) => count + (combined.split(token).length - 1),
        0,
      ),
      functionCount: extractFunctionBlocks(codeText).length,
    },
  });
}
