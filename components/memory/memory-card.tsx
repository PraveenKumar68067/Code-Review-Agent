"use client";

import { Brain, Search, Sparkles } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RuleChip } from "@/components/memory/rule-chip";
import type { MemoryItem } from "@/lib/models";

export function MemoryCard({ memory }: { memory: MemoryItem }) {
  return (
    <Card className="border-border/80">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-sky-500/10 p-2 text-sky-600 dark:text-sky-300">
              {memory.kind.includes("optimization") ? <Sparkles className="h-4 w-4" /> : memory.kind.includes("rule") ? <Brain className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium">{memory.title}</p>
              <p className="text-xs text-muted-foreground">{memory.source}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{memory.content}</p>
          <div className="flex flex-wrap gap-2">
            <RuleChip label={memory.kind} />
            <RuleChip label={memory.category} />
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Inspect</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{memory.title}</DialogTitle>
              <DialogDescription>
                Confidence {memory.confidence.toFixed(2)} • Source {memory.source}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p>{memory.content}</p>
              <div className="flex flex-wrap gap-2">
                {(memory.keywords ?? []).map((keyword) => (
                  <RuleChip key={keyword} label={keyword} />
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
