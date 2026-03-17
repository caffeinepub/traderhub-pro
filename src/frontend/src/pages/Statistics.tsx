import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import type { Trade } from "../backend";
import { useActor } from "../hooks/useActor";

function pairLabel(t: Trade) {
  return `${t.pair.base}/${t.pair.quote}`;
}

export default function Statistics() {
  const { actor } = useActor();

  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: () => actor!.getAllTrades(),
    enabled: !!actor,
  });

  const stats = useMemo(() => {
    if (trades.length === 0) return null;
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const winRate = (wins.length / trades.length) * 100;
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const avgWin =
      wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss =
      losses.length > 0
        ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0)) / losses.length
        : 0;
    const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
    const best = [...trades].sort((a, b) => b.pnl - a.pnl)[0];
    const worst = [...trades].sort((a, b) => a.pnl - b.pnl)[0];

    // By pair
    const byPair: Record<string, { count: number; pnl: number; wins: number }> =
      {};
    for (const t of trades) {
      const k = pairLabel(t);
      if (!byPair[k]) byPair[k] = { count: 0, pnl: 0, wins: 0 };
      byPair[k].count++;
      byPair[k].pnl += t.pnl;
      if (t.pnl > 0) byPair[k].wins++;
    }
    const pairStats = Object.entries(byPair).sort(
      (a, b) => b[1].count - a[1].count,
    );

    // By month
    const byMonth: Record<string, number> = {};
    for (const t of trades) {
      const d = new Date(Number(t.date) / 1_000_000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + t.pnl;
    }
    const monthStats = Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);
    const maxAbsMonth = Math.max(...monthStats.map(([, v]) => Math.abs(v)), 1);

    return {
      winRate,
      totalPnl,
      rr,
      best,
      worst,
      pairStats,
      monthStats,
      maxAbsMonth,
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
    };
  }, [trades]);

  if (isLoading) {
    return (
      <div
        data-ocid="stats.loading_state"
        className="flex h-full items-center justify-center"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-sm text-muted-foreground">
          Your trading performance overview
        </p>
      </div>

      {!stats ? (
        <div data-ocid="stats.empty_state" className="text-center py-16">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No trades yet. Start logging to see your stats.
          </p>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Trades",
                value: stats.totalTrades.toString(),
                sub: `${stats.wins}W / ${stats.losses}L`,
              },
              {
                label: "Win Rate",
                value: `${stats.winRate.toFixed(1)}%`,
                sub:
                  stats.winRate >= 50 ? "Above breakeven" : "Below breakeven",
                pos: stats.winRate >= 50,
              },
              {
                label: "Avg R:R Ratio",
                value: `1:${stats.rr.toFixed(2)}`,
                sub: stats.rr >= 1.5 ? "Good ratio" : "Improve R:R",
              },
              {
                label: "Total P&L",
                value: `${stats.totalPnl >= 0 ? "+$" : "-$"}${Math.abs(stats.totalPnl).toFixed(2)}`,
                sub: "All time",
                pos: stats.totalPnl >= 0,
              },
            ].map(({ label, value, sub, pos }) => (
              <Card key={label} className="border border-border">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold font-mono mt-1",
                      pos !== undefined
                        ? pos
                          ? "text-profit"
                          : "text-loss"
                        : "",
                    )}
                  >
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Best / Worst */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card
              data-ocid="stats.best_trade.card"
              className="border border-profit/30 glow-profit"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-profit" />
                  Best Trade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold font-mono">
                      {pairLabel(stats.best)}
                    </p>
                    <Badge
                      className={cn(
                        "text-xs mt-1",
                        stats.best.direction === "buy"
                          ? "bg-buy/20 text-buy"
                          : "bg-sell/20 text-sell",
                      )}
                      variant="outline"
                    >
                      {stats.best.direction.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold font-mono text-profit">
                      +${stats.best.pnl.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.best.pips.toFixed(1)} pips
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              data-ocid="stats.worst_trade.card"
              className="border border-loss/30 glow-loss"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-loss" />
                  Worst Trade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold font-mono">
                      {pairLabel(stats.worst)}
                    </p>
                    <Badge
                      className={cn(
                        "text-xs mt-1",
                        stats.worst.direction === "buy"
                          ? "bg-buy/20 text-buy"
                          : "bg-sell/20 text-sell",
                      )}
                      variant="outline"
                    >
                      {stats.worst.direction.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold font-mono text-loss">
                      -${Math.abs(stats.worst.pnl).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.worst.pips.toFixed(1)} pips
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Pair */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Performance by Pair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.pairStats.map(([pair, data], i) => (
                <div
                  data-ocid={`stats.pair.item.${i + 1}`}
                  key={pair}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-mono w-20 flex-shrink-0">
                    {pair}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        data.pnl >= 0
                          ? "bg-[oklch(var(--profit))]"
                          : "bg-[oklch(var(--loss))]",
                      )}
                      style={{ width: `${(data.wins / data.count) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {data.count} trades
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono font-bold w-20 text-right",
                      data.pnl >= 0 ? "text-profit" : "text-loss",
                    )}
                  >
                    {data.pnl >= 0 ? "+$" : "-$"}
                    {Math.abs(data.pnl).toFixed(2)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly P&L */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Monthly P&amp;L (Last 6 months)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.monthStats.map(([month, pnl], i) => (
                <div
                  data-ocid={`stats.month.item.${i + 1}`}
                  key={month}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-mono w-20 flex-shrink-0">
                    {month}
                  </span>
                  <div className="flex-1 h-4 rounded bg-accent overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded",
                        pnl >= 0
                          ? "bg-[oklch(var(--profit)/0.7)]"
                          : "bg-[oklch(var(--loss)/0.7)]",
                      )}
                      style={{
                        width: `${(Math.abs(pnl) / stats.maxAbsMonth) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono font-bold w-20 text-right",
                      pnl >= 0 ? "text-profit" : "text-loss",
                    )}
                  >
                    {pnl >= 0 ? "+$" : "-$"}
                    {Math.abs(pnl).toFixed(2)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
