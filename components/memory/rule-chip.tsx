import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

export function RuleChip({ label }: { label: string }) {
  return <Badge variant="outline">{titleCase(label)}</Badge>;
}
