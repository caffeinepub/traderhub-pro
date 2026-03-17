import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import type { Page } from "../App";
import type { Trade } from "../backend";
import { useActor } from "../hooks/useActor";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

function formatPnl(val: number) {
  const sign = val >= 0 ? "+" : "";
  return `${sign}$${Math.abs(val).toFixed(2)}`;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { actor } = useActor();

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

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTs = now.getTime() * 1_000_000;
    const todayTrades = trades.filter((t) => Number(t.date) >= todayTs);
    const totalPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalPips = todayTrades.reduce((sum, t) => sum + t.pips, 0);
    const wins = todayTrades.filter((t) => t.pnl > 0).length;
    const losses = todayTrades.filter((t) => t.pnl < 0).length;
    return { trades: todayTrades, totalPnl, totalPips, wins, losses };
  }, [trades]);

  const recentTrades = useMemo(
    () =>
      [...trades].sort((a, b) => Number(b.date) - Number(a.date)).slice(0, 5),
    [trades],
  );

  const lossUsedPct =
    dailyLimit && dailyLimit.lossLimit > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (Math.abs(Math.min(0, today.totalPnl)) / dailyLimit.lossLimit) *
              100,
          ),
        )
      : 0;
  const profitPct =
    dailyLimit && dailyLimit.profitTarget > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (Math.max(0, today.totalPnl) / dailyLimit.profitTarget) * 100,
          ),
        )
      : 0;

  return (
    <div className="p-6 space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          data-ocid="dashboard.add_trade.button"
          onClick={() => onNavigate("journal")}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" /> New Trade
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          data-ocid="dashboard.pnl.card"
          className={cn(
            "border",
            today.totalPnl >= 0
              ? "border-profit/30 glow-profit"
              : "border-loss/30 glow-loss",
          )}
        >
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's P&amp;L
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={cn(
                "text-2xl font-bold font-mono tabular-nums",
                today.totalPnl >= 0 ? "text-profit" : "text-loss",
              )}
            >
              {formatPnl(today.totalPnl)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {today.trades.length} trade{today.trades.length !== 1 ? "s" : ""}{" "}
              today
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's Pips
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={cn(
                "text-2xl font-bold font-mono tabular-nums",
                today.totalPips >= 0 ? "text-profit" : "text-loss",
              )}
            >
              {today.totalPips >= 0 ? "+" : ""}
              {today.totalPips.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">pips net</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Wins / Losses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-mono tabular-nums">
              <span className="text-profit">{today.wins}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-loss">{today.losses}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">today's record</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-mono tabular-nums">
              {trades.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Gauges */}
      {dailyLimit && (
        <Card data-ocid="dashboard.risk.card" className="border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Daily Risk Monitor
              </CardTitle>
              {lossUsedPct >= 80 && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1 text-xs"
                >
                  <AlertTriangle className="h-3 w-3" /> Loss Limit Warning
                </Badge>
              )}
              {profitPct >= 100 && (
                <Badge className="bg-profit text-primary-foreground text-xs">
                  🎯 Profit Target Hit!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Loss Used</span>
                <span className="font-mono text-loss">
                  ${Math.abs(Math.min(0, today.totalPnl)).toFixed(2)} / $
                  {dailyLimit.lossLimit.toFixed(2)}
                </span>
              </div>
              <Progress
                value={lossUsedPct}
                className="h-2 [&>div]:bg-[oklch(var(--loss))]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Profit Progress</span>
                <span className="font-mono text-profit">
                  ${Math.max(0, today.totalPnl).toFixed(2)} / $
                  {dailyLimit.profitTarget.toFixed(2)}
                </span>
              </div>
              <Progress
                value={profitPct}
                className="h-2 [&>div]:bg-[oklch(var(--profit))]"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Trades */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Recent Trades
            </CardTitle>
            <Button
              data-ocid="dashboard.journal.link"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("journal")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div
              data-ocid="dashboard.trades.empty_state"
              className="text-center py-8"
            >
              <p className="text-muted-foreground text-sm">
                No trades logged yet.
              </p>
              <Button
                data-ocid="dashboard.add_first_trade.button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onNavigate("journal")}
              >
                <Plus className="h-3 w-3 mr-2" />
                Log your first trade
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade, i) => (
                <div
                  data-ocid={`dashboard.trade.item.${i + 1}`}
                  key={Number(trade.id)}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        "text-xs px-2 py-0.5 font-mono",
                        trade.direction === "buy"
                          ? "bg-buy/20 text-buy border border-buy/30"
                          : "bg-sell/20 text-sell border border-sell/30",
                      )}
                    >
                      {trade.direction.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium font-mono">
                      {trade.pair.base}/{trade.pair.quote}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground font-mono">
                      {trade.pips >= 0 ? "+" : ""}
                      {trade.pips.toFixed(1)} pips
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold font-mono",
                        trade.pnl >= 0 ? "text-profit" : "text-loss",
                      )}
                    >
                      {formatPnl(trade.pnl)}
                    </span>
                    {trade.pnl >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-profit" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-loss" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(
          [
            {
              label: "Open Journal",
              page: "journal",
              icon: TrendingUp,
              ocid: "dashboard.journal.button",
            },
            {
              label: "Pips Calc",
              page: "calculator",
              icon: Target,
              ocid: "dashboard.calculator.button",
            },
            {
              label: "Checklist",
              page: "checklist",
              icon: TrendingUp,
              ocid: "dashboard.checklist.button",
            },
            {
              label: "Risk Setup",
              page: "risk",
              icon: AlertTriangle,
              ocid: "dashboard.risk.button",
            },
          ] as const
        ).map(({ label, page, icon: Icon, ocid }) => (
          <Button
            key={page}
            data-ocid={ocid}
            variant="outline"
            className="h-auto py-3 flex flex-col gap-1 text-xs"
            onClick={() => onNavigate(page as Page)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
