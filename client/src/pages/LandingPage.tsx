import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Timer, BarChart3, History } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Interval Timer</h1>
          <p className="text-lg text-muted-foreground">
            Track your workouts, analyze your performance, and reach your fitness goals
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Timer className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Custom Intervals</h3>
            <p className="text-sm text-muted-foreground">
              Create custom workout timers with drag-and-drop segments
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Workout History</h3>
            <p className="text-sm text-muted-foreground">
              Keep track of all your completed workouts with detailed logs
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Performance Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Analyze your progress with insights for specific exercises
            </p>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
