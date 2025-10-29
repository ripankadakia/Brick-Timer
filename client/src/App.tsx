import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import TimerPage from "@/pages/TimerPage";
import HistoryPage from "@/pages/HistoryPage";
import AnalyticsPage from "@/pages/AnalyticsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TimerPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/analytics" component={AnalyticsPage} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col h-screen bg-background">
          <main className="flex-1 overflow-hidden">
            <Router />
          </main>
          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
