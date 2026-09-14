import { BrainCircuit, History, Lightbulb, Repeat2 } from "lucide-react";

import { MemoryCard } from "@/components/memory/memory-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MemoryItem } from "@/lib/models";

type MemoryPanelProps = {
  memories: MemoryItem[];
  similarPastIssues: Array<Record<string, any>>;
};

export function MemoryPanel({ memories, similarPastIssues }: MemoryPanelProps) {
  const teamRulesMatched = memories.filter((memory) => memory.kind.includes("rule") || memory.kind.includes("preference")).length;
  const acceptedFeedbackUsed = memories.filter((memory) => memory.kind.includes("optimization") || memory.title.toLowerCase().includes("accepted")).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-sky-200 bg-sky-50/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Memory Used</p>
              <BrainCircuit className="h-4 w-4 text-sky-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold">{memories.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Retrieved memory items influenced this review.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Team Rules Matched</p>
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold">{teamRulesMatched}</p>
            <p className="mt-1 text-sm text-muted-foreground">Architecture and coding standards applied.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Similar Past Issues</p>
              <History className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold">{similarPastIssues.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Historical matches reused during review reasoning.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Accepted Feedback Used</p>
              <Repeat2 className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold">{acceptedFeedbackUsed}</p>
            <p className="mt-1 text-sm text-muted-foreground">Past accepted suggestions reused in this review.</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Retrieved Memories</CardTitle>
            <CardDescription>Exact memory items pulled into the review before generating feedback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No memory retrieved for this run. Switch memory mode on or use a more team-specific example.</p>
            ) : (
              memories.map((memory) => <MemoryCard key={memory.id} memory={memory} />)
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Similar Past Issues</CardTitle>
            <CardDescription>Historical findings that made the current review more personalized and specific.</CardDescription>
          </CardHeader>
          <CardContent>
            {similarPastIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No similar past issues were matched.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {similarPastIssues.map((issue, index) => (
                    <TableRow key={`${issue.reviewId}-${index}`}>
                      <TableCell>{issue.title}</TableCell>
                      <TableCell>{issue.category}</TableCell>
                      <TableCell>{issue.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
