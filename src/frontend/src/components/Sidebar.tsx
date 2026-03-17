import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Calculator,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Shield,
  TrendingUp,
} from "lucide-react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "calculator", label: "Pips Calc", icon: Calculator },
  { id: "messenger", label: "Messenger", icon: MessageSquare },
  { id: "checklist", label: "Checklist", icon: CheckSquare },
  { id: "risk", label: "Risk Mgmt", icon: Shield },
  { id: "stats", label: "Statistics", icon: BarChart3 },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { clear } = useInternetIdentity();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex flex-col w-16 md:w-56 h-full bg-sidebar border-r border-sidebar-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 md:px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden md:block font-bold text-sm tracking-wide text-foreground">
            TraderHub Pro
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-ocid={`nav.${item.id}.link`}
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-foreground border-l-2 border-primary pl-[calc(0.75rem-2px)]"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive && "text-primary",
                      )}
                    />
                    <span className="hidden md:block">{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="md:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-sidebar-border pt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-ocid="nav.logout.button"
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                onClick={clear}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span className="hidden md:block text-sm">Sign Out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="md:hidden">
              Sign Out
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
