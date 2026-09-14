import { BookOpen, ChartLine, Clock3, FolderKanban, Gauge, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const demoStoryItems = [
  { value: "review", label: "Review Output", icon: Gauge },
  { value: "memory", label: "Memory Used", icon: BookOpen },
  { value: "trends", label: "Trends", icon: ChartLine },
  { value: "habits", label: "Coding Habits", icon: ShieldCheck },
  { value: "comparison", label: "Comparison", icon: FolderKanban },
  { value: "history", label: "Review History", icon: Clock3 },
] as const;

export type DemoStorySection = (typeof demoStoryItems)[number]["value"];

type SidebarProps = {
  activeSection: DemoStorySection;
  onSectionChange: (section: DemoStorySection) => void;
};

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <Card className="sticky top-5 border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Demo Flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {demoStoryItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onSectionChange(item.value)}
              className={cn(
                "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-200",
                activeSection === item.value
                  ? "border-sky-200 bg-gradient-to-r from-sky-50 to-white text-sky-950 shadow-sm ring-1 ring-sky-200 dark:border-sky-700 dark:from-sky-950/60 dark:to-cyan-950/30 dark:text-sky-100 dark:shadow-none dark:ring-sky-800"
                  : "border-border/80 bg-white hover:border-sky-200 hover:bg-sky-50/50 hover:shadow-sm dark:bg-background/70 dark:hover:border-sky-800 dark:hover:bg-sky-950/20",
              )}
              aria-pressed={activeSection === item.value}
            >
              {activeSection === item.value ? <div className="absolute inset-y-2 left-1 w-1 rounded-full bg-sky-500" /> : null}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  activeSection === item.value
                    ? "border-sky-200 bg-white text-sky-700 dark:border-sky-800 dark:bg-sky-950/70"
                    : "border-border/80 bg-slate-50 text-slate-500 dark:bg-background/80",
                )}
              >
                <item.icon className={cn("h-4 w-4", activeSection === item.value ? "text-sky-600" : "text-slate-500")} />
              </div>
              <span className={cn("text-sm", activeSection === item.value ? "font-semibold" : "font-medium")}>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-border/80 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-muted">
          Run baseline, turn memory on, save one rule, re-run.
        </div>
      </CardContent>
    </Card>
  );
}
