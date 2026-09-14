import type { HabitProfile } from "@/lib/models";

type HabitHistory = {
  habits: Array<{ habitType: string; trend: string; evidence: string; score: number } | Record<string, any>>;
};

export function buildHabitProfile(history: HabitHistory): HabitProfile {
  const normalizedHabits = history.habits.map((habit) => ({
    habitType: String(habit.habitType ?? "maintainability"),
    trend: String(habit.trend ?? "stable"),
    evidence: String(habit.evidence ?? "No evidence captured yet."),
    score: Number(habit.score ?? 60),
  }));

  const habitScores = Object.fromEntries(normalizedHabits.map((habit) => [habit.habitType, habit.score]));
  const strengths = normalizedHabits.filter((habit) => habit.score >= 65).map((habit) => habit.habitType).slice(0, 3);
  const weakHabits = normalizedHabits.filter((habit) => habit.score < 60).map((habit) => habit.habitType).slice(0, 4);
  const repeatedPatterns = normalizedHabits
    .filter((habit) => ["declining", "stable", "watch"].includes(habit.trend))
    .map((habit) => habit.evidence)
    .slice(0, 4);

  const coachSuggestions: string[] = [];
  if (weakHabits.includes("validation")) {
    coachSuggestions.push("Create a small input validation helper and use it at each request boundary.");
  }
  if (weakHabits.includes("error_handling")) {
    coachSuggestions.push("Wrap external calls with a consistent try/except plus structured logging pattern.");
  }
  if (weakHabits.includes("architecture")) {
    coachSuggestions.push("When a route starts branching or calculating, move that logic into a service function.");
  }
  if (weakHabits.includes("logging")) {
    coachSuggestions.push("Replace print statements with structured logging that includes operation context.");
  }
  if (weakHabits.includes("maintainability")) {
    coachSuggestions.push("When the same branch or calculation appears twice, promote it into a shared helper before it spreads.");
  }
  if (weakHabits.includes("naming")) {
    coachSuggestions.push("Use names that describe domain meaning, not temporary implementation details.");
  }

  return {
    strengths,
    weakHabits,
    repeatedPatterns,
    coachSuggestions: coachSuggestions.slice(0, 4),
    habitScores,
  };
}
