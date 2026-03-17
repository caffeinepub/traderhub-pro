import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Shield,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DailyLimit, Trade } from "../backend";
import { useActor } from "../hooks/useActor";

const TIPS = [
  {
    title: "1% Rule",
    desc: "Never risk more than 1-2% of your account on a single trade.",
  },
  {
    title: "Daily Loss Cap",
    desc: "Once your daily loss limit is hit, stop trading. No exceptions.",
  },
  {
    title: "Take Profits Early",
    desc: "When near your profit target, consider reducing position size.",
  },
  {
    title: "Revenge Trading",
    desc: "After a loss, take a break. Emotional trades compound losses.",
  },
  {
    title: "Risk:Reward Minimum",
    desc: "Only take trades with at least a 1:2 risk-to-reward ratio.",
  },
];

export default function RiskManagement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: () => actor!.getAllTrades(),
    enabled: !!actor,
  });

  const { data: dailyLimit } = useQuery({
    queryKey: ["dailyLimit"],
    queryFn: () => actor!.getDailyLimit(),
    enabled: !!actor,
  });

  const [lossLimit, setLossLimit] = useState("");
  const [profitTarget, setProfitTarget] = useState("");

  useEffect(() => {
    if (dailyLimit) {
      setLossLimit(String(dailyLimit.lossLimit));
      setProfitTarget(String(dailyLimit.profitTarget));
    }
  }, [dailyLimit]);

  const todayPnl = (() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTs = now.getTime() * 1_000_000;
    return trades
      .filter((t) => Number(t.date) >= todayTs)
      .reduce((s, t) => s + t.pnl, 0);
  })();

  const { mutate: saveLimits, isPending } = useMutation({
    mutationFn: async () => {
      const limit: DailyLimit = {
        lossLimit: Number.parseFloat(lossLimit) || 0,
        profitTarget: Number.parseFloat(profitTarget) || 0,
        isActive: true,
        date: BigInt(Date.now()) * 1_000_000n,
      };
      await actor!.setDailyLimit(limit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLimit"] });
      toast.success("Risk limits saved");
    },
    onError: () => toast.error("Failed to save limits"),
  });

  const lossLimitN = Number.parseFloat(lossLimit) || 0;
  const profitTargetN = Number.parseFloat(profitTarget) || 0;
  const lossUsed = Math.abs(Math.min(0, todayPnl));
  const profitGained = Math.max(0, todayPnl);
  const lossPct =
    lossLimitN > 0 ? Math.min(100, (lossUsed / lossLimitN) * 100) : 0;
  const profitPct =
    profitTargetN > 0 ? Math.min(100, (profitGained / profitTargetN) * 100) : 0;
  const lossBreached = lossLimitN > 0 && lossUsed >= lossLimitN;
  const profitHit = profitTargetN > 0 && profitGained >= profitTargetN;

  return (
    <div className="p-6 space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Risk Management</h1>
        <p className="text-sm text-muted-foreground">
          Set your daily loss limit and profit target
        </p>
      </div>

      {/* Alerts */}
      {lossBreached && (
        <div
          data-ocid="risk.loss_breach.error_state"
          className="flex items-center gap-3 p-4 rounded-lg bg-loss/10 border border-loss/40"
        >
          <AlertTriangle className="h-5 w-5 text-loss flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-loss">
              Daily Loss Limit Reached!
            </p>
            <p className="text-xs text-muted-foreground">
              You have hit your daily loss limit of ${lossLimitN.toFixed(2)}.
              Stop trading for today.
            </p>
          </div>
        </div>
      )}
      {profitHit && (
        <div
          data-ocid="risk.profit_target.success_state"
          className="flex items-center gap-3 p-4 rounded-lg bg-profit/10 border border-profit/40"
        >
          <CheckCircle2 className="h-5 w-5 text-profit flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-profit">
              Profit Target Reached!
            </p>
            <p className="text-xs text-muted-foreground">
              Excellent! Consider reducing position size or stopping for the
              day.
            </p>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-loss" />
              Daily Loss Limit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Maximum loss allowed today ($)</Label>
              <Input
                data-ocid="risk.loss_limit.input"
                type="number"
                placeholder="e.g. 200"
                value={lossLimit}
                onChange={(e) => setLossLimit(e.target.value)}
                className="text-lg font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Once this amount is lost today, you must stop trading.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-profit" />
              Daily Profit Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Target profit for today ($)</Label>
              <Input
                data-ocid="risk.profit_target.input"
                type="number"
                placeholder="e.g. 500"
                value={profitTarget}
                onChange={(e) => setProfitTarget(e.target.value)}
                className="text-lg font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Consider stepping back once you hit this target.
            </p>
          </CardContent>
        </Card>
      </div>

      <Button
        data-ocid="risk.save.primary_button"
        className="w-full md:w-auto"
        onClick={() => saveLimits()}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Save Risk Limits
          </>
        )}
      </Button>

      {/* Live Status */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Today's Risk Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-loss" />
                <span className="text-sm">Loss Used</span>
                {lossPct >= 80 && (
                  <Badge variant="destructive" className="text-xs">
                    Warning
                  </Badge>
                )}
              </div>
              <span className="text-sm font-mono">
                <span className="text-loss">${lossUsed.toFixed(2)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  / ${lossLimitN.toFixed(2)}
                </span>
              </span>
            </div>
            <Progress
              value={lossPct}
              className="h-3 [&>div]:bg-[oklch(var(--loss))]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {lossPct.toFixed(0)}% of daily loss limit used
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-profit" />
                <span className="text-sm">Profit Progress</span>
                {profitHit && (
                  <Badge className="bg-profit text-primary-foreground text-xs">
                    Target Hit!
                  </Badge>
                )}
              </div>
              <span className="text-sm font-mono">
                <span className="text-profit">${profitGained.toFixed(2)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  / ${profitTargetN.toFixed(2)}
                </span>
              </span>
            </div>
            <Progress
              value={profitPct}
              className="h-3 [&>div]:bg-[oklch(var(--profit))]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {profitPct.toFixed(0)}% of profit target achieved
            </p>
          </div>

          <div
            className={cn(
              "text-center p-4 rounded-lg border",
              todayPnl >= 0
                ? "bg-profit/5 border-profit/20"
                : "bg-loss/5 border-loss/20",
            )}
          >
            <p className="text-xs text-muted-foreground">Today's Net P&amp;L</p>
            <p
              className={cn(
                "text-3xl font-bold font-mono mt-1",
                todayPnl >= 0 ? "text-profit" : "text-loss",
              )}
            >
              {todayPnl >= 0 ? "+$" : "-$"}
              {Math.abs(todayPnl).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            Risk Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TIPS.map((tip, i) => (
            <div key={tip.title} className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-warning text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
