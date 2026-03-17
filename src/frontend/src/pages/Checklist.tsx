import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ChecklistItem } from "../backend";
import { useActor } from "../hooks/useActor";

const DEFAULT_ITEMS: Omit<ChecklistItem, "id">[] = [
  {
    title: "Checked economic calendar for high-impact events",
    isChecked: false,
  },
  { title: "Reviewed yesterday's trades and lessons", isChecked: false },
  { title: "Set daily loss limit & profit target", isChecked: false },
  { title: "Identified key support & resistance levels", isChecked: false },
  { title: "Checked market sessions (London/NY overlap)", isChecked: false },
  { title: "Defined clear trade setup criteria", isChecked: false },
  { title: "Emotional state check — calm and focused", isChecked: false },
  { title: "No revenge trading mindset", isChecked: false },
];

export default function Checklist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [localItems, setLocalItems] = useState<ChecklistItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { isLoading } = useQuery<ChecklistItem[]>({
    queryKey: ["checklist"],
    queryFn: async () => {
      const items = await actor!.getChecklist();
      if (items.length === 0 && !initialized) {
        setInitialized(true);
        const defaults = DEFAULT_ITEMS.map((item, i) => ({
          ...item,
          id: BigInt(i + 1),
        }));
        setLocalItems(defaults);
        return defaults;
      }
      setLocalItems(items);
      return items;
    },
    enabled: !!actor,
  });

  const { mutate: addItem, isPending: addPending } = useMutation({
    mutationFn: async (title: string) => {
      const item: ChecklistItem = {
        id: BigInt(Date.now()),
        title,
        isChecked: false,
      };
      await actor!.addChecklistItem(item);
      return item;
    },
    onSuccess: (item) => {
      setLocalItems((prev) => [...prev, item]);
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      setNewItem("");
      toast.success("Item added");
    },
  });

  const { mutate: resetAll } = useMutation({
    mutationFn: () => actor!.resetAllChecks(),
    onSuccess: () => {
      setLocalItems((prev) => prev.map((i) => ({ ...i, isChecked: false })));
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      toast.success("Checklist reset for new day");
    },
  });

  const toggleItem = (id: bigint) => {
    setLocalItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isChecked: !i.isChecked } : i)),
    );
  };

  const checked = localItems.filter((i) => i.isChecked).length;
  const total = localItems.length;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  const allDone = total > 0 && checked === total;

  return (
    <div className="p-6 space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discipline Checklist</h1>
          <p className="text-sm text-muted-foreground">
            Complete before opening any trade
          </p>
        </div>
        <Button
          data-ocid="checklist.reset.button"
          variant="outline"
          size="sm"
          onClick={() => resetAll()}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Day
        </Button>
      </div>

      {/* Progress */}
      <Card
        className={cn(
          "border transition-all",
          allDone ? "border-profit/40 glow-profit" : "border-border",
        )}
      >
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">
                {checked}/{total} completed
              </p>
              <p className="text-xs text-muted-foreground">
                Daily trading readiness
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-mono text-primary">
                {pct}%
              </p>
              {allDone && (
                <Badge className="bg-profit text-primary-foreground text-xs mt-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready to Trade
                </Badge>
              )}
            </div>
          </div>
          <Progress
            value={pct}
            className={cn(
              "h-2",
              allDone
                ? "[&>div]:bg-[oklch(var(--profit))]"
                : "[&>div]:bg-primary",
            )}
          />
        </CardContent>
      </Card>

      {allDone && (
        <div
          data-ocid="checklist.ready.success_state"
          className="flex items-center gap-3 p-4 rounded-lg bg-profit/10 border border-profit/30"
        >
          <CheckCircle2 className="h-5 w-5 text-profit flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-profit">
              You're Ready to Trade!
            </p>
            <p className="text-xs text-muted-foreground">
              All discipline checks passed. Trade with confidence and follow
              your plan.
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pre-Trade Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <div
              data-ocid="checklist.loading_state"
              className="flex justify-center py-8"
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            localItems.map((item, i) => (
              <div
                data-ocid={`checklist.item.${i + 1}`}
                key={Number(item.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  item.isChecked ? "bg-profit/5" : "hover:bg-accent/30",
                )}
              >
                <Checkbox
                  data-ocid={`checklist.checkbox.${i + 1}`}
                  checked={item.isChecked}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="data-[state=checked]:bg-profit data-[state=checked]:border-profit"
                />
                <span
                  className={cn(
                    "text-sm flex-1",
                    item.isChecked && "line-through text-muted-foreground",
                  )}
                >
                  {item.title}
                </span>
                {item.isChecked && (
                  <CheckCircle2 className="h-4 w-4 text-profit flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add custom item */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Add Custom Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              data-ocid="checklist.add_item.input"
              placeholder="e.g. Checked correlation with DXY"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newItem.trim())
                  addItem(newItem.trim());
              }}
            />
            <Button
              data-ocid="checklist.add_item.button"
              onClick={() => newItem.trim() && addItem(newItem.trim())}
              disabled={!newItem.trim() || addPending}
            >
              {addPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
