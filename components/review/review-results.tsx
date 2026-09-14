import { ReviewCard } from "@/components/review/review-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewIssue } from "@/lib/models";

type ReviewResultsProps = {
  issues: ReviewIssue[];
  userId: string;
  workspaceId: string;
  language: string;
  onMemoryAction: (action: "team_rule" | "common_mistake" | "architecture_preference", issue: ReviewIssue) => Promise<void>;
};

export function ReviewResults({ issues, userId, workspaceId, language, onMemoryAction }: ReviewResultsProps) {
  return (
    <Card className="border-border/80 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle>Review Output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues.map((issue) => (
          <ReviewCard key={issue.id} issue={issue} userId={userId} workspaceId={workspaceId} language={language} onMemoryAction={onMemoryAction} />
        ))}
      </CardContent>
    </Card>
  );
}
