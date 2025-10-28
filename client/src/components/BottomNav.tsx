import { Timer, History, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { path: "/", icon: Timer, label: "Timer" },
    { path: "/history", icon: History, label: "History" },
    { path: "/analytics", icon: TrendingUp, label: "Analytics" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-20 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;
          
          return (
            <Link key={tab.path} href={tab.path}>
              <button
                data-testid={`nav-${tab.label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors ${
                  isActive
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
