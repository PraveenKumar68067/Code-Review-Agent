"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { demoStoryItems, type DemoStorySection } from "@/components/layout/sidebar";
import { WorkspaceBar } from "@/components/layout/workspace-bar";
import { ReviewHistory } from "@/components/history/review-history";
import { MemoryPanel } from "@/components/memory/memory-panel";
import { ComparisonPanel } from "@/components/review/comparison-panel";
import { CodeInputPanel } from "@/components/review/code-input-panel";
import { FixPatternsPanel } from "@/components/review/fix-patterns-panel";
import { JudgingHighlights } from "@/components/review/judging-highlights";
import { ReviewResults } from "@/components/review/review-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HabitsPanel } from "@/components/trends/habits-panel";
import { ScoreCards } from "@/components/trends/score-cards";
import { TrendPanel } from "@/components/trends/trend-panel";
import { useFeedback } from "@/hooks/use-feedback";
import { useHistory } from "@/hooks/use-history";
import { useReview } from "@/hooks/use-review";
import type { ReviewHistoryEntry, ReviewIssue, ReviewResult, UserHistory } from "@/lib/models";

const sampleCode: Record<string, string> = {
  "Bad API Route": `from flask import Blueprint, request, jsonify

bp = Blueprint("orders", __name__)

@bp.route("/orders", methods=["POST"])
def create_order():
    payload = request.get_json() or {}
    customer_id = payload.get("customer_id")
    items = payload.get("items", [])
    total = 0
    for item in items:
        if item.get("vip"):
            total += item["price"] * 0.8
        else:
            total += item["price"]
    conn = get_db()
    conn.execute("insert into orders(customer_id, total, item_count) values (?, ?, ?)", (customer_id, total, len(items)))
    conn.commit()
    print("created order", customer_id, total)
    return jsonify({"ok": True, "total": total})`,
  "Weak Validation": `def register_user(payload, repo):
    email = payload["email"]
    age = payload.get("age")
    country = payload.get("country")
    user = {
        "email": email.strip(),
        "age": int(age),
        "country": country.lower(),
    }
    return repo.save_user(user)`,
  "Duplicate Logic": `def calculate_cart_total(items):
    total = 0
    for item in items:
        if item.get("discount"):
            total += item["price"] - item["discount"]
        else:
            total += item["price"]
    if total > 200:
        total -= 20
    return total

def calculate_checkout_total(items):
    total = 0
    for item in items:
        if item.get("discount"):
            total += item["price"] - item["discount"]
        else:
            total += item["price"]
    if total > 200:
        total -= 20
    return total`,
  "Poor Logging": `def sync_invoice(invoice_id, client):
    print("starting sync")
    response = client.fetch(invoice_id)
    if response.status_code != 200:
        print("bad response", response.status_code)
        raise RuntimeError("sync failed")
    print("finished sync")
    return response.json()`,
  "Mixed Responsibility": `class UserController:
    def create_user(self, payload, repo, email_client, audit_client):
        if "email" not in payload:
            return {"error": "email required"}, 400
        existing = repo.find_by_email(payload["email"])
        if existing:
            return {"error": "exists"}, 409
        user = {
            "email": payload["email"].strip().lower(),
            "role": payload.get("role", "viewer"),
        }
        repo.insert(user)
        email_client.send_welcome(user["email"])
        audit_client.track("user_created", {"email": user["email"], "role": user["role"]})
        return {"ok": True, "user": user}, 201`,
};

type WorkspaceHistory = UserHistory | null;

type WorkspaceState = {
  id: string;
  name: string;
  code: string;
  diff: string;
  language: string;
  userLevel: "beginner" | "intermediate" | "advanced";
  memoryEnabled: boolean;
  currentResult: ReviewResult | null;
  baselineResult: ReviewResult | null;
  memoryResult: ReviewResult | null;
  history: WorkspaceHistory;
  trendPoints: Array<{ timestamp: string; overall: number }>;
  memoryHits: number;
  repeatedMistakes: number;
};

function createWorkspace(id: string, name: string): WorkspaceState {
  return {
    id,
    name,
    code: sampleCode["Bad API Route"],
    diff: "",
    language: "python",
    userLevel: "intermediate",
    memoryEnabled: true,
    currentResult: null,
    baselineResult: null,
    memoryResult: null,
    history: null,
    trendPoints: [],
    memoryHits: 0,
    repeatedMistakes: 0,
  };
}

export default function Page() {
  const reviewMutation = useReview();
  const comparisonReviewMutation = useReview();
  const feedbackMutation = useFeedback();
  const userId = "demo_user";
  const [teamPreferences, setTeamPreferences] = useState<Array<Record<string, any>>>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceState[]>([createWorkspace("workspace-default", "Workspace 1")]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("workspace-default");
  const [activeSection, setActiveSection] = useState<DemoStorySection>("review");
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];
  const historyQuery = useHistory(userId, activeWorkspace.id);

  useEffect(() => {
    fetch(`/api/memories?language=python&userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(activeWorkspaceId)}&code=route%20repo%20validation`)
      .then((response) => response.json())
      .then((payload) => setTeamPreferences(payload.data?.preferences ?? []))
      .catch(() => setTeamPreferences([]));
  }, [userId, activeWorkspaceId]);

  useEffect(() => {
    const queryPayload = historyQuery.data as { workspaceId: string; history: UserHistory } | undefined;
    if (!queryPayload || queryPayload.workspaceId !== activeWorkspaceId) {
      return;
    }

    const historyData = queryPayload.history as WorkspaceHistory;
    setWorkspaces((current) =>
      current.map((workspace) => {
        if (workspace.id !== activeWorkspaceId) return workspace;
        const trends = (historyData?.trends as Array<{ timestamp: string; overall: number }> | undefined) ?? [];
        return {
          ...workspace,
          history: historyData,
          trendPoints: trends.map((item) => ({
            timestamp: item.timestamp.slice(5, 10),
            overall: item.overall,
          })),
        };
      }),
    );
  }, [historyQuery.data, activeWorkspaceId]);

  const updateWorkspace = (workspaceId: string, updater: (workspace: WorkspaceState) => WorkspaceState) => {
    setWorkspaces((current) => current.map((workspace) => (workspace.id === workspaceId ? updater(workspace) : workspace)));
  };

  const handleSectionChange = (section: DemoStorySection) => {
    setActiveSection(section);
    dashboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCreateWorkspace = () => {
    const nextIndex = workspaces.length + 1;
    const newWorkspace = createWorkspace(`workspace-${Date.now()}`, `Workspace ${nextIndex}`);
    setWorkspaces((current) => [...current, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
  };

  const handleRenameWorkspace = (workspaceId: string) => {
    const currentName = workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? "Workspace";
    const nextName = window.prompt("Rename workspace", currentName);
    if (!nextName?.trim()) return;
    updateWorkspace(workspaceId, (workspace) => ({ ...workspace, name: nextName.trim() }));
  };

  const handleCloseWorkspace = (workspaceId: string) => {
    if (workspaces.length === 1) return;
    const nextWorkspaces = workspaces.filter((workspace) => workspace.id !== workspaceId);
    setWorkspaces(nextWorkspaces);
    if (workspaceId === activeWorkspaceId) {
      setActiveWorkspaceId(nextWorkspaces[0].id);
    }
  };

  const runReview = async () => {
    const payload = {
      code: activeWorkspace.code,
      diff: activeWorkspace.diff,
      language: activeWorkspace.language,
      userLevel: activeWorkspace.userLevel,
      memoryEnabled: activeWorkspace.memoryEnabled,
      userId,
      workspaceId: activeWorkspace.id,
      persist: true,
    };

    const [selected, comparison] = await Promise.all([
      reviewMutation.mutateAsync(payload),
      comparisonReviewMutation.mutateAsync({
        ...payload,
        memoryEnabled: !activeWorkspace.memoryEnabled,
        persist: false,
      }),
    ]);

    updateWorkspace(activeWorkspace.id, (workspace) => ({
      ...workspace,
      currentResult: selected,
      baselineResult: workspace.memoryEnabled ? comparison : selected,
      memoryResult: workspace.memoryEnabled ? selected : comparison,
      memoryHits: selected.memoriesUsed.length,
      repeatedMistakes: selected.repeatedMistakes.length,
    }));
    setActiveSection("comparison");
  };

  const handleMemoryAction = async (
    action: "team_rule" | "common_mistake" | "architecture_preference",
    issue: ReviewIssue,
  ) => {
    await feedbackMutation.mutateAsync({
      issueId: issue.id,
      issueTitle: issue.title,
      action,
      category: issue.category,
      userId,
      workspaceId: activeWorkspace.id,
      notes: issue.suggestion,
      language: activeWorkspace.language,
    });
    const response = await fetch(`/api/memories?language=${encodeURIComponent(activeWorkspace.language)}&userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(activeWorkspace.id)}&code=${encodeURIComponent(activeWorkspace.code)}`);
    const payload = (await response.json()) as { data?: { preferences?: Array<Record<string, any>> } };
    setTeamPreferences(payload.data?.preferences ?? []);
  };

  const activeSectionMeta = useMemo(
    () => demoStoryItems.find((item) => item.value === activeSection) ?? demoStoryItems[0],
    [activeSection],
  );

  const emptySectionCopy: Record<DemoStorySection, { title: string; body: string }> = {
    review: {
      title: "AI review output will appear here",
      body: "Run a review to see structured issues, severity labels, architecture callouts, and concrete fix suggestions.",
    },
    memory: {
      title: "Memory evidence will appear here",
      body: "Turn memory on to see matched team rules, similar past mistakes, and accepted feedback that influenced the output.",
    },
    trends: {
      title: "Trend analysis will appear here",
      body: "After a review, this section shows score movement, improvement signals, and recurring weaknesses across submissions.",
    },
    habits: {
      title: "Coding habits will appear here",
      body: "This section summarizes validation, logging, naming, duplication, and architecture habits over time.",
    },
    comparison: {
      title: "Without-memory vs with-memory comparison",
      body: "Run a review to compare the generic baseline against the memory-powered, team-aware version side by side.",
    },
    history: {
      title: "Workspace review history will appear here",
      body: "Each workspace keeps its own review history, trends, feedback loop, and repeated issue memory.",
    },
  };

  function EmptyStateCard({ section }: { section: DemoStorySection }) {
    const copy = emptySectionCopy[section];
    return (
      <Card className="border-border/80 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">{copy.body}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Detect team rule violations</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Catch thin-route violations, weak validation, and architecture drift against stored team standards.</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Find repeated mistakes</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Show which issues have appeared before so the reviewer feels personalized and historically aware.</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Suggest reusable fixes</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Turn recurring review comments into patterns that can be reused in future backend changes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "review":
        return activeWorkspace.currentResult ? (
          <ReviewResults
            issues={activeWorkspace.currentResult.issues}
            userId={userId}
            workspaceId={activeWorkspace.id}
            language={activeWorkspace.language}
            onMemoryAction={handleMemoryAction}
          />
        ) : (
          <EmptyStateCard section="review" />
        );
      case "memory":
        return activeWorkspace.currentResult ? (
          <MemoryPanel memories={activeWorkspace.currentResult.memoriesUsed} similarPastIssues={activeWorkspace.currentResult.similarPastIssues} />
        ) : (
          <EmptyStateCard section="memory" />
        );
      case "trends":
        return activeWorkspace.currentResult ? (
          <TrendPanel result={activeWorkspace.currentResult} historyTrendData={activeWorkspace.trendPoints} />
        ) : (
          <EmptyStateCard section="trends" />
        );
      case "habits":
        return activeWorkspace.currentResult ? <HabitsPanel habits={activeWorkspace.currentResult.habitProfile} /> : <EmptyStateCard section="habits" />;
      case "comparison":
        return activeWorkspace.baselineResult || activeWorkspace.memoryResult ? (
          <ComparisonPanel baseline={activeWorkspace.baselineResult} memoryAware={activeWorkspace.memoryResult} />
        ) : (
          <EmptyStateCard section="comparison" />
        );
      case "history":
        return (
          <ReviewHistory
            reviews={(activeWorkspace.history?.reviews as ReviewHistoryEntry[] | undefined) ?? []}
            teamRules={teamPreferences}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppShell
      header={<Header memoryEnabled={activeWorkspace.memoryEnabled} onMemoryEnabledChange={(value) => updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, memoryEnabled: value }))} />}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    >
      <WorkspaceBar
        workspaces={workspaces.map((workspace) => ({ id: workspace.id, name: workspace.name }))}
        activeWorkspaceId={activeWorkspace.id}
        onSelect={setActiveWorkspaceId}
        onCreate={handleCreateWorkspace}
        onRename={handleRenameWorkspace}
        onClose={handleCloseWorkspace}
      />

      <CodeInputPanel
        code={activeWorkspace.code}
        diff={activeWorkspace.diff}
        language={activeWorkspace.language}
        userLevel={activeWorkspace.userLevel}
        onCodeChange={(value) => updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, code: value }))}
        onDiffChange={(value) => updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, diff: value }))}
        onLanguageChange={(value) => updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, language: value }))}
        onUserLevelChange={(value) => updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, userLevel: value }))}
        onLoadSample={(label) => {
          updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, code: sampleCode[label] }));
        }}
        onReview={() => void runReview()}
        loading={reviewMutation.isPending || comparisonReviewMutation.isPending}
      />

      <div ref={dashboardRef} className="space-y-6">
        <ScoreCards result={activeWorkspace.currentResult} />
        {activeWorkspace.currentResult ? (
          <>
            <JudgingHighlights result={activeWorkspace.currentResult} />
            <FixPatternsPanel patterns={activeWorkspace.currentResult.reusableFixPatterns} />
          </>
        ) : null}

        <div className="lg:hidden">
          <Card className="border-border/80 bg-white shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace Flow</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{activeSectionMeta.label}</p>
              </div>
              <Select value={activeSection} onValueChange={(value) => handleSectionChange(value as DemoStorySection)}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {demoStoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-sky-50">
                <activeSectionMeta.icon className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Section</p>
                <p className="text-lg font-semibold text-slate-950">{activeSectionMeta.label}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              {activeWorkspace.currentResult
                ? `Workspace: ${activeWorkspace.name}. Switch sections from the sidebar to inspect isolated review history and memory.`
                : `Workspace: ${activeWorkspace.name}. Run your first review to start isolated memory and history.`}
            </div>
          </div>
          {renderActiveSection()}
        </section>
      </div>
    </AppShell>
  );
}
