"use client";

import { BrainCircuit, GitBranch, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type HeaderProps = {
  memoryEnabled: boolean;
  onMemoryEnabledChange: (value: boolean) => void;
};

export function Header({ memoryEnabled, onMemoryEnabledChange }: HeaderProps) {
  return (
    <header className="rounded-[24px] border border-border/80 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="gap-1 text-[11px]">
              <BrainCircuit className="h-3.5 w-3.5" />
              Persistent Memory
            </Badge>
            <Badge variant="outline" className="gap-1 text-[11px]">
              <GitBranch className="h-3.5 w-3.5" />
              CascadeFlow
            </Badge>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Memory-Powered Code Review Agent</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              A team-aware reviewer that learns coding standards, architectural preferences, accepted fixes, and repeated mistakes over time.
            </p>
          </div>
        </div>
        <div className="flex min-w-[235px] items-center justify-between rounded-2xl border border-border/80 bg-slate-50 px-3.5 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-900">Memory Mode</p>
            <p className="text-xs text-slate-600">
              {memoryEnabled ? "Uses history, team rules, and accepted patterns" : "Runs a generic baseline review"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className={`h-4 w-4 ${memoryEnabled ? "text-sky-500" : "text-slate-400"}`} />
            <Switch checked={memoryEnabled} onCheckedChange={onMemoryEnabledChange} />
          </div>
        </div>
      </div>
    </header>
  );
}
