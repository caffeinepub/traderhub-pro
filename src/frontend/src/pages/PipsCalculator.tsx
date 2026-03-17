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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Calculator, History, X } from "lucide-react";
import { useState } from "react";
import type { CurrencyPair } from "../backend";

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
];

const LOT_SIZES = [
  { label: "Micro", value: 0.01, description: "0.01 lots" },
  { label: "Mini", value: 0.1, description: "0.1 lots" },
  { label: "Standard", value: 1.0, description: "1.0 lots" },
];

interface CalcResult {
  pair: string;
  direction: string;
  entry: number;
  exit: number;
  lots: number;
  pips: number;
  pnl: number;
  rr: number;
  ts: string;
}

function calculate(
  pair: CurrencyPair,
  direction: string,
  entry: number,
  exit: number,
  lots: number,
  risk: number,
  reward: number,
): CalcResult {
  const diff = direction === "buy" ? exit - entry : entry - exit;
  const isJPY = pair.quote === "JPY";
  const pips = isJPY ? diff * 100 : diff * 10000;
  const pipValue = isJPY
    ? (0.01 / exit) * lots * 100000
    : (0.0001 / exit) * lots * 100000;
  const pnl = pips * pipValue;
  const rr = risk > 0 ? reward / risk : 0;
  return {
    pair: `${pair.base}/${pair.quote}`,
    direction,
    entry,
    exit,
    lots,
    pips,
    pnl,
    rr,
    ts: new Date().toLocaleTimeString(),
  };
}

export default function PipsCalculator() {
  const [pairKey, setPairKey] = useState("EUR/USD");
  const [direction, setDirection] = useState("buy");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [lots, setLots] = useState("0.1");
  const [risk, setRisk] = useState("");
  const [reward, setReward] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [history, setHistory] = useState<CalcResult[]>([]);

  const selectedPair =
    PAIRS.find((p) => `${p.base}/${p.quote}` === pairKey) || PAIRS[0];

  const handleCalculate = () => {
    const e = Number.parseFloat(entry);
    const x = Number.parseFloat(exit);
    const l = Number.parseFloat(lots);
    if (!e || !x || !l) return;
    const r = calculate(
      selectedPair,
      direction,
      e,
      x,
      l,
      Number.parseFloat(risk) || 0,
      Number.parseFloat(reward) || 0,
    );
    setResult(r);
    setHistory((h) => [r, ...h].slice(0, 10));
  };

  return (
    <div className="p-6 space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Pips Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Calculate pips, P&amp;L, and risk-reward ratio instantly
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="space-y-4">
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Currency Pair</Label>
                  <Select value={pairKey} onValueChange={setPairKey}>
                    <SelectTrigger data-ocid="calc.pair.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAIRS.map((p) => (
                        <SelectItem
                          key={`${p.base}/${p.quote}`}
                          value={`${p.base}/${p.quote}`}
                        >
                          {p.base}/{p.quote}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Direction</Label>
                  <ToggleGroup
                    type="single"
                    value={direction}
                    onValueChange={(v) => v && setDirection(v)}
                    className="w-full"
                  >
                    <ToggleGroupItem
                      data-ocid="calc.buy.toggle"
                      value="buy"
                      className="flex-1 data-[state=on]:bg-buy/20 data-[state=on]:text-buy"
                    >
                      BUY
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      data-ocid="calc.sell.toggle"
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
                    data-ocid="calc.entry.input"
                    type="number"
                    step="0.00001"
                    placeholder="1.08500"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Exit Price</Label>
                  <Input
                    data-ocid="calc.exit.input"
                    type="number"
                    step="0.00001"
                    placeholder="1.09000"
                    value={exit}
                    onChange={(e) => setExit(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Lot Size</Label>
                <Input
                  data-ocid="calc.lots.input"
                  type="number"
                  step="0.01"
                  placeholder="0.10"
                  value={lots}
                  onChange={(e) => setLots(e.target.value)}
                />
                <div className="flex gap-2 mt-1">
                  {LOT_SIZES.map((ls) => (
                    <button
                      type="button"
                      key={ls.label}
                      onClick={() => setLots(String(ls.value))}
                      className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent/70 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {ls.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Risk Amount ($)</Label>
                  <Input
                    data-ocid="calc.risk.input"
                    type="number"
                    placeholder="50"
                    value={risk}
                    onChange={(e) => setRisk(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reward Amount ($)</Label>
                  <Input
                    data-ocid="calc.reward.input"
                    type="number"
                    placeholder="150"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                  />
                </div>
              </div>

              <Button
                data-ocid="calc.calculate.primary_button"
                className="w-full"
                onClick={handleCalculate}
              >
                <Calculator className="h-4 w-4 mr-2" /> Calculate
              </Button>
            </CardContent>
          </Card>

          {/* Lot reference */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                Lot Size Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Micro", lots: "0.01", units: "1,000", pip: "$0.10" },
                  { name: "Mini", lots: "0.10", units: "10,000", pip: "$1.00" },
                  {
                    name: "Standard",
                    lots: "1.00",
                    units: "100,000",
                    pip: "$10.00",
                  },
                ].map((r) => (
                  <div
                    key={r.name}
                    className="text-center p-3 rounded-lg bg-accent/20 border border-border"
                  >
                    <p className="text-xs font-semibold text-foreground">
                      {r.name}
                    </p>
                    <p className="text-lg font-bold font-mono text-primary mt-1">
                      {r.lots}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.units} units
                    </p>
                    <p className="text-xs text-muted-foreground">{r.pip}/pip</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result && (
            <Card
              data-ocid="calc.result.card"
              className={cn(
                "border",
                result.pips >= 0
                  ? "border-profit/30 glow-profit"
                  : "border-loss/30 glow-loss",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Result</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        result.direction === "buy"
                          ? "bg-buy/20 text-buy"
                          : "bg-sell/20 text-sell",
                      )}
                    >
                      {result.direction.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      {result.pair}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pips</p>
                    <p
                      className={cn(
                        "text-3xl font-bold font-mono",
                        result.pips >= 0 ? "text-profit" : "text-loss",
                      )}
                    >
                      {result.pips >= 0 ? "+" : ""}
                      {result.pips.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Profit / Loss
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold font-mono",
                        result.pnl >= 0 ? "text-profit" : "text-loss",
                      )}
                    >
                      {result.pnl >= 0 ? "+$" : "-$"}
                      {Math.abs(result.pnl).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      R:R Ratio
                    </p>
                    <p className="text-3xl font-bold font-mono text-warning">
                      {result.rr > 0 ? `1:${result.rr.toFixed(1)}` : "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry</span>
                    <span className="font-mono">{result.entry.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exit</span>
                    <span className="font-mono">{result.exit.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lots</span>
                    <span className="font-mono">{result.lots.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculated at</span>
                    <span className="font-mono">{result.ts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {history.map((h, i) => (
                  <div
                    data-ocid={`calc.history.item.${i + 1}`}
                    key={h.ts}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-xs px-1.5 py-0",
                          h.direction === "buy"
                            ? "bg-buy/20 text-buy"
                            : "bg-sell/20 text-sell",
                        )}
                        variant="outline"
                      >
                        {h.direction.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-mono">{h.pair}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-xs font-mono",
                          h.pips >= 0 ? "text-profit" : "text-loss",
                        )}
                      >
                        {h.pips >= 0 ? "+" : ""}
                        {h.pips.toFixed(1)}p
                      </span>
                      <span
                        className={cn(
                          "text-xs font-mono font-bold",
                          h.pnl >= 0 ? "text-profit" : "text-loss",
                        )}
                      >
                        {h.pnl >= 0 ? "+$" : "-$"}
                        {Math.abs(h.pnl).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {h.ts}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
