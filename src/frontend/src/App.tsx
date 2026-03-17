import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Checklist from "./pages/Checklist";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import Messenger from "./pages/Messenger";
import PipsCalculator from "./pages/PipsCalculator";
import RiskManagement from "./pages/RiskManagement";
import Statistics from "./pages/Statistics";
import TradingJournal from "./pages/TradingJournal";

export type Page =
  | "dashboard"
  | "journal"
  | "calculator"
  | "messenger"
  | "checklist"
  | "risk"
  | "stats";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "journal":
        return <TradingJournal />;
      case "calculator":
        return <PipsCalculator />;
      case "messenger":
        return <Messenger />;
      case "checklist":
        return <Checklist />;
      case "risk":
        return <RiskManagement />;
      case "stats":
        return <Statistics />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      <Toaster />
    </div>
  );
}
