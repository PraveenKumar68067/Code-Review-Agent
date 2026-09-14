"use client";

import { Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkspaceTab = {
  id: string;
  name: string;
};

type WorkspaceBarProps = {
  workspaces: WorkspaceTab[];
  activeWorkspaceId: string;
  onSelect: (workspaceId: string) => void;
  onCreate: () => void;
  onRename: (workspaceId: string) => void;
  onClose: (workspaceId: string) => void;
};

export function WorkspaceBar({
  workspaces,
  activeWorkspaceId,
  onSelect,
  onCreate,
  onRename,
  onClose,
}: WorkspaceBarProps) {
  return (
    <Card className="border-border/80 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspaces</p>
          <p className="mt-1 text-sm text-slate-600">Each workspace keeps its own code, review history, feedback loop, and isolated memory.</p>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          {workspaces.map((workspace) => {
            const isActive = workspace.id === activeWorkspaceId;
            return (
              <div
                key={workspace.id}
                className={cn(
                  "flex items-center gap-1 rounded-2xl border px-2 py-1",
                  isActive ? "border-sky-200 bg-sky-50 shadow-sm" : "border-border/80 bg-slate-50",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(workspace.id)}
                  className={cn(
                    "rounded-xl px-2.5 py-1.5 text-sm transition-colors",
                    isActive ? "font-semibold text-sky-900" : "font-medium text-slate-700 hover:text-slate-900",
                  )}
                >
                  {workspace.name}
                </button>
                <button type="button" onClick={() => onRename(workspace.id)} className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-800">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {workspaces.length > 1 ? (
                  <button type="button" onClick={() => onClose(workspace.id)} className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-rose-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            );
          })}
          <Button size="sm" variant="outline" className="rounded-full" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
