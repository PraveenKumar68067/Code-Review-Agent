"use client";

import { useState } from "react";
import { Loader2, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CodeInputPanelProps = {
  code: string;
  diff: string;
  language: string;
  userLevel: "beginner" | "intermediate" | "advanced";
  onCodeChange: (value: string) => void;
  onDiffChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onUserLevelChange: (value: "beginner" | "intermediate" | "advanced") => void;
  onLoadSample: (sample: string) => void;
  onReview: () => void;
  loading: boolean;
};

const samples = ["Bad API Route", "Weak Validation", "Duplicate Logic", "Poor Logging", "Mixed Responsibility"];

export function CodeInputPanel(props: CodeInputPanelProps) {
  const [showDiff, setShowDiff] = useState(Boolean(props.diff));

  return (
    <Card className="border-border/80 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Review Workspace</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          Paste backend code, choose the coaching level, and optionally add a PR diff to make the review more context aware.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[180px_220px_1fr_auto]">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={props.language} onValueChange={props.onLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>User Level</Label>
            <Select value={props.userLevel} onValueChange={(value) => props.onUserLevelChange(value as CodeInputPanelProps["userLevel"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Demo Samples</Label>
            <div className="flex flex-wrap gap-2">
              {samples.map((sample) => (
                <Button key={sample} variant="outline" size="sm" className="rounded-full" onClick={() => props.onLoadSample(sample)}>
                  {sample}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-end">
            <Button size="lg" className="w-full min-w-[160px] shadow-sm lg:w-auto" onClick={props.onReview} disabled={props.loading}>
              {props.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              Review Code
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Paste Code</Label>
              <span className="text-xs text-slate-500">Primary review input</span>
            </div>
            <Textarea
              value={props.code}
              onChange={(event) => props.onCodeChange(event.target.value)}
              className="min-h-[360px] rounded-2xl border-slate-300 bg-slate-950 p-4 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500"
            />
          </div>

          <div className="rounded-2xl border border-border/80 bg-slate-50/80 p-4">
            <button
              type="button"
              onClick={() => setShowDiff((current) => !current)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">Add PR Diff</p>
                <p className="text-xs text-slate-600">Include a diff when you want the reviewer to account for changed lines and patch context.</p>
              </div>
              <span className="text-xs font-medium text-sky-700">{showDiff ? "Hide" : "Show"}</span>
            </button>
            {showDiff ? (
              <div className="mt-4 space-y-2">
                <Label>PR Diff</Label>
                <Textarea
                  value={props.diff}
                  onChange={(event) => props.onDiffChange(event.target.value)}
                  className="min-h-[150px] rounded-2xl border-slate-300 bg-white p-4 font-mono text-xs text-slate-900"
                />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
