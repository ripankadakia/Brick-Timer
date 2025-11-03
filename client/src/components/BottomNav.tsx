import { Timer, History, TrendingUp, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useWorkout } from "@/contexts/WorkoutContext";

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function BottomNav() {
  const [location] = useLocation();
  const { isActive, currentSegmentTime, intervals, currentSegmentIndex, isPaused } = useWorkout();

  const tabs = [
    { path: "/", icon: Timer, label: "Timer" },
    { path: "/history", icon: History, label: "History" },
    { path: "/analytics", icon: TrendingUp, label: "Analytics" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const showWorkoutIndicator = isActive && location !== "/";
  const currentSegmentName = intervals[currentSegmentIndex]?.name || "";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      {showWorkoutIndicator && (
        <div className="border-b border-border bg-card">
          <Link href="/">
            <button
              data-testid="workout-indicator"
              className="w-full px-4 py-2 flex items-center justify-between hover-elevate active-elevate-2"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-sm font-medium">{currentSegmentName}</span>
              </div>
              <span className="text-sm font-mono tabular-nums">{formatTime(currentSegmentTime)}</span>
            </button>
          </Link>
        </div>
      )}
      <div className="flex items-center justify-around h-20 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = location === tab.path;
          
          return (
            <Link key={tab.path} href={tab.path}>
              <button
                data-testid={`nav-${tab.label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors ${
                  isActiveTab
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
