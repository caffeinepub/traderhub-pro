import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, Loader2, Shield, TrendingUp } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card border-r border-border p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">TraderHub Pro</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Your complete
              <br />
              <span className="text-profit">trading command</span>
              <br />
              center.
            </h1>
            <p className="text-muted-foreground text-lg">
              Journal trades, manage risk, connect with fellow traders — all in
              one professional platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: BookOpen,
                label: "Trading Journal",
                desc: "Log every trade with precision",
              },
              {
                icon: Shield,
                label: "Risk Management",
                desc: "Daily loss limits & profit targets",
              },
              {
                icon: BarChart3,
                label: "Statistics",
                desc: "Win rate, RR ratio & more",
              },
              {
                icon: TrendingUp,
                label: "Pips Calculator",
                desc: "Instant profit calculations",
              },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-lg bg-accent/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Secured by Internet Computer Protocol
        </p>
      </div>

      {/* Right panel - login */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TraderHub Pro</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Sign in to your account</h2>
            <p className="text-muted-foreground">
              Use Internet Identity for secure, passwordless access.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              data-ocid="login.primary_button"
              size="lg"
              className="w-full font-semibold"
              onClick={login}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Connect with Internet Identity
                </>
              )}
            </Button>
          </div>

          <div className="border-t border-border pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { value: "0%", label: "Commission" },
                { value: "100%", label: "Private" },
                { value: "∞", label: "Trades" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-lg font-bold text-primary">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
