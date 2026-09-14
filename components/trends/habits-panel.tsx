import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HabitProfile } from "@/lib/models";

type HabitsPanelProps = {
  habits: HabitProfile;
};

export function HabitsPanel({ habits }: HabitsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Object.entries(habits.habitScores).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{key.replace(/_/g, " ")}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Strengths</CardTitle>
          <CardDescription>Areas where the codebase habits look consistently healthy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {habits.strengths.length > 0 ? habits.strengths.map((item) => <div key={item} className="rounded-xl bg-muted/60 p-3 text-sm">{item}</div>) : <p className="text-sm text-muted-foreground">No clear strengths detected yet.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Weak Areas</CardTitle>
          <CardDescription>Habit patterns that still need attention in repeated submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {habits.weakHabits.length > 0 ? habits.weakHabits.map((item) => <div key={item} className="rounded-xl bg-muted/60 p-3 text-sm">{item}</div>) : <p className="text-sm text-muted-foreground">No major weak areas detected.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Repeated Patterns</CardTitle>
          <CardDescription>Recurring behaviors the reviewer keeps spotting across reviews.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {habits.repeatedPatterns.length > 0 ? habits.repeatedPatterns.map((item) => <div key={item} className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{item}</div>) : <p className="text-sm text-muted-foreground">No repeated patterns captured yet.</p>}
        </CardContent>
      </Card>
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Coach-Style Suggestions</CardTitle>
          <CardDescription>Targeted next steps based on the habits detected in review history.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {habits.coachSuggestions.length > 0 ? habits.coachSuggestions.map((item) => <div key={item} className="rounded-xl bg-muted/60 p-4 text-sm">{item}</div>) : <p className="text-sm text-muted-foreground">No coaching suggestions yet.</p>}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
