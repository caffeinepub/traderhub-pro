import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CurrencyPair, Trade } from "../backend";
import { useActor } from "../hooks/useActor";

const PAIRS: CurrencyPair[] = [
  { base: "EUR", quote: "USD", forex: true },
  { base: "GBP", quote: "USD", forex: true },
  { base: "USD", quote: "JPY", forex: true },
  { base: "AUD", quote: "USD", forex: true },
  { base: "USD", quote: "CAD", forex: true },
  { base: "NZD", quote: "USD", forex: true },
  { base: "USD", quote: "CHF", forex: true },
  { base: "GBP", quote: "JPY", forex: true },
  { base: "EUR", quote: "JPY", forex: true },
  { base: "XAU", quote: "USD", forex: false },
  { base: "BTC", quote: "USD", forex: false },
  { base: "ETH", quote: "USD", forex: false },
];

function pairLabel(p: CurrencyPair) {
  return `${p.base}/${p.quote}`;
}

function computePips(
  pair: CurrencyPair,
  entry: number,
  exit: number,
  direction: string,
): number {
  const diff = direction === "buy" ? exit - entry : entry - exit;
  const isJPY = pair.quote === "JPY";
  return isJPY ? diff * 100 : diff * 10000;
}

export default function TradingJournal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterDir, setFilterDir] = useState("all");
  const [filterPair, setFilterPair] = useState("all");

  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: () => actor!.getAllTrades(),
    enabled: !!actor,
  });

  // Form state
  const [form, setForm] = useState({
    pairKey: "EUR/USD",
    direction: "buy",
    entry: "",
    exit: "",
    lots: "",
    risk: "",
    reward: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const selectedPair =
    PAIRS.find((p) => pairLabel(p) === form.pairKey) || PAIRS[0];
  const entryN = Number.parseFloat(form.entry) || 0;
  const exitN = Number.parseFloat(form.exit) || 0;
  const lotsN = Number.parseFloat(form.lots) || 0;
  const calcPips =
    entryN && exitN
      ? computePips(selectedPair, entryN, exitN, form.direction)
      : 0;
  const pipValue = selectedPair.quote === "JPY" ? 0.01 : 0.0001;
  const calcPnl =
    lotsN && entryN && exitN
      ? (calcPips * pipValue * lotsN * 100000) /
        (selectedPair.quote === "JPY" ? 100 : 1)
      : 0;

  const { mutate: addTrade, isPending } = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const trade: Trade = {
        id: BigInt(Date.now()),
        pair: selectedPair,
        direction: form.direction,
        entryPrice: entryN,
        exitPrice: exitN,
        lotSize: lotsN,
        pips: calcPips,
        pnl: calcPnl,
        riskAmount: Number.parseFloat(form.risk) || 0,
        rewardAmount: Number.parseFloat(form.reward) || 0,
        notes: form.notes,
        date: BigInt(new Date(form.date).getTime()) * 1_000_000n,
      };
      await actor.addTrade(trade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade logged successfully");
      setOpen(false);
      setForm({
        pairKey: "EUR/USD",
        direction: "buy",
        entry: "",
        exit: "",
        lots: "",
        risk: "",
        reward: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
    },
    onError: () => toast.error("Failed to log trade"),
  });

  const filtered = useMemo(() => {
    return trades
      .filter((t) => {
        if (filterDir !== "all" && t.direction !== filterDir) return false;
        if (filterPair !== "all" && pairLabel(t.pair) !== filterPair)
          return false;
        return true;
      })
      .sort((a, b) => Number(b.date) - Number(a.date));
  }, [trades, filterDir, filterPair]);

  const exportCSV = () => {
    const headers = [
      "Date",
      "Pair",
      "Direction",
      "Entry",
      "Exit",
      "Lots",
      "Pips",
      "P&L",
      "Notes",
    ];
    const rows = filtered.map((t) => [
      new Date(Number(t.date) / 1_000_000).toLocaleDateString(),
      pairLabel(t.pair),
      t.direction,
      t.entryPrice,
      t.exitPrice,
      t.lotSize,
      t.pips.toFixed(1),
      t.pnl.toFixed(2),
      t.notes,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trades.csv";
    a.click();
  };

  return (
    <div className="p-6 space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Journal</h1>
          <p className="text-sm text-muted-foreground">
            {trades.length} total trades recorded
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="journal.export.button"
            variant="outline"
            size="sm"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button data-ocid="journal.add_trade.button" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </SheetTrigger>
            <SheetContent
              className="w-full sm:max-w-lg overflow-y-auto"
              data-ocid="journal.add_trade.sheet"
            >
              <SheetHeader>
                <SheetTitle>Log New Trade</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Currency Pair</Label>
                    <Select
                      value={form.pairKey}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, pairKey: v }))
                      }
                    >
                      <SelectTrigger data-ocid="journal.pair.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAIRS.map((p) => (
                          <SelectItem key={pairLabel(p)} value={pairLabel(p)}>
                            {pairLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Direction</Label>
                    <ToggleGroup
                      type="single"
                      value={form.direction}
                      onValueChange={(v) =>
                        v && setForm((f) => ({ ...f, direction: v }))
                      }
                      className="w-full"
                    >
                      <ToggleGroupItem
                        data-ocid="journal.buy.toggle"
                        value="buy"
                        className="flex-1 data-[state=on]:bg-buy/20 data-[state=on]:text-buy"
                      >
                        BUY
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        data-ocid="journal.sell.toggle"
                        value="sell"
                        className="flex-1 data-[state=on]:bg-sell/20 data-[state=on]:text-sell"
                      >
                        SELL
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Entry Price</Label>
                    <Input
                      data-ocid="journal.entry.input"
                      type="number"
                      step="0.00001"
                      placeholder="1.08500"
                      value={form.entry}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, entry: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Exit Price</Label>
                    <Input
                      data-ocid="journal.exit.input"
                      type="number"
                      step="0.00001"
                      placeholder="1.09000"
                      value={form.exit}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, exit: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Lot Size</Label>
                  <Input
                    data-ocid="journal.lots.input"
                    type="number"
                    step="0.01"
                    placeholder="0.10"
                    value={form.lots}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lots: e.target.value }))
                    }
                  />
                </div>

                {/* Calculated values */}
                {entryN > 0 && exitN > 0 && (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-accent/30 border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Pips</p>
                      <p
                        className={cn(
                          "text-lg font-bold font-mono",
                          calcPips >= 0 ? "text-profit" : "text-loss",
                        )}
                      >
                        {calcPips >= 0 ? "+" : ""}
                        {calcPips.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Est. P&amp;L
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold font-mono",
                          calcPnl >= 0 ? "text-profit" : "text-loss",
                        )}
                      >
                        {calcPnl >= 0 ? "+$" : "-$"}
                        {Math.abs(calcPnl).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Risk ($)</Label>
                    <Input
                      data-ocid="journal.risk.input"
                      type="number"
                      placeholder="50"
                      value={form.risk}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, risk: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reward ($)</Label>
                    <Input
                      data-ocid="journal.reward.input"
                      type="number"
                      placeholder="150"
                      value={form.reward}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reward: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    data-ocid="journal.date.input"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    data-ocid="journal.notes.textarea"
                    placeholder="Trade setup, reasoning, emotions..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <Button
                  data-ocid="journal.save_trade.submit_button"
                  className="w-full"
                  onClick={() => addTrade()}
                  disabled={
                    isPending || !form.entry || !form.exit || !form.lots
                  }
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Trade"
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <ToggleGroup
          type="single"
          value={filterDir}
          onValueChange={(v) => v && setFilterDir(v)}
          size="sm"
        >
          <ToggleGroupItem data-ocid="journal.filter_all.toggle" value="all">
            All
          </ToggleGroupItem>
          <ToggleGroupItem
            data-ocid="journal.filter_buy.toggle"
            value="buy"
            className="data-[state=on]:bg-buy/20 data-[state=on]:text-buy"
          >
            Buy
          </ToggleGroupItem>
          <ToggleGroupItem
            data-ocid="journal.filter_sell.toggle"
            value="sell"
            className="data-[state=on]:bg-sell/20 data-[state=on]:text-sell"
          >
            Sell
          </ToggleGroupItem>
        </ToggleGroup>
        <Select value={filterPair} onValueChange={setFilterPair}>
          <SelectTrigger
            data-ocid="journal.filter_pair.select"
            className="w-36 h-8 text-xs"
          >
            <SelectValue placeholder="All Pairs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pairs</SelectItem>
            {PAIRS.map((p) => (
              <SelectItem key={pairLabel(p)} value={pairLabel(p)}>
                {pairLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div
              data-ocid="journal.loading_state"
              className="flex items-center justify-center py-12"
            >
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div data-ocid="journal.empty_state" className="text-center py-12">
              <p className="text-muted-foreground">No trades found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Pair</TableHead>
                  <TableHead className="text-xs">Dir</TableHead>
                  <TableHead className="text-xs text-right">Entry</TableHead>
                  <TableHead className="text-xs text-right">Exit</TableHead>
                  <TableHead className="text-xs text-right">Lots</TableHead>
                  <TableHead className="text-xs text-right">Pips</TableHead>
                  <TableHead className="text-xs text-right">P&amp;L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t, i) => (
                  <TableRow
                    data-ocid={`journal.trade.item.${i + 1}`}
                    key={Number(t.id)}
                    className={cn(
                      "border-border",
                      t.pnl >= 0
                        ? "bg-profit/5 hover:bg-profit/10"
                        : "bg-loss/5 hover:bg-loss/10",
                    )}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(
                        Number(t.date) / 1_000_000,
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      {pairLabel(t.pair)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs px-1.5 py-0",
                          t.direction === "buy"
                            ? "bg-buy/20 text-buy border-buy/30"
                            : "bg-sell/20 text-sell border-sell/30",
                        )}
                        variant="outline"
                      >
                        {t.direction.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right">
                      {t.entryPrice.toFixed(5)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right">
                      {t.exitPrice.toFixed(5)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-right">
                      {t.lotSize.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs font-mono font-medium text-right",
                        t.pips >= 0 ? "text-profit" : "text-loss",
                      )}
                    >
                      {t.pips >= 0 ? "+" : ""}
                      {t.pips.toFixed(1)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs font-mono font-bold text-right",
                        t.pnl >= 0 ? "text-profit" : "text-loss",
                      )}
                    >
                      {t.pnl >= 0 ? "+$" : "-$"}
                      {Math.abs(t.pnl).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
