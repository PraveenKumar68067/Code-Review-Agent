"use client";

import { BookmarkPlus, CheckCheck, Flag, Save, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFeedback } from "@/hooks/use-feedback";
import type { ReviewIssue } from "@/lib/models";

type FeedbackActionsProps = {
  issue: ReviewIssue;
  userId: string;
  workspaceId: string;
  language: string;
  onMemoryAction: (action: "team_rule" | "common_mistake" | "architecture_preference", issue: ReviewIssue) => Promise<void>;
};

export function FeedbackActions({ issue, userId, workspaceId, language, onMemoryAction }: FeedbackActionsProps) {
  const feedback = useFeedback();

  const submitFeedback = async (action: string) => {
    await feedback.mutateAsync({
      issueId: issue.id,
      issueTitle: issue.title,
      action,
      category: issue.category,
      userId,
      workspaceId,
      language,
      notes: [issue.suggestion, issue.architectureGuidance, issue.similarFixPattern, issue.learningNote]
        .filter(Boolean)
        .join(" | "),
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => void submitFeedback("helpful")}>
        <ThumbsUp className="mr-2 h-4 w-4" />
        Helpful
      </Button>
      <Button size="sm" variant="outline" onClick={() => void submitFeedback("not_helpful")}>
        <ThumbsDown className="mr-2 h-4 w-4" />
        Not Helpful
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onMemoryAction("team_rule", issue)}>
        <Save className="mr-2 h-4 w-4" />
        Save as Team Rule
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onMemoryAction("common_mistake", issue)}>
        <Flag className="mr-2 h-4 w-4" />
        Save as Common Mistake
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onMemoryAction("architecture_preference", issue)}>
        <BookmarkPlus className="mr-2 h-4 w-4" />
        Mark as Architecture Preference
      </Button>
      <Button size="sm" variant="secondary" onClick={() => void submitFeedback("accept_fix_pattern")}>
        <CheckCheck className="mr-2 h-4 w-4" />
        Accept Fix Pattern
      </Button>
      <Button size="sm" variant="ghost" onClick={() => void submitFeedback("reject_fix_pattern")}>
        <XCircle className="mr-2 h-4 w-4" />
        Reject Fix Pattern
      </Button>
    </div>
  );
}
