
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkoutSummaryProps {
  workoutName: string;
  segments: { name: string; duration: number }[];
  totalTime: number;
  onStartNewWorkout: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function WorkoutSummary({
  workoutName,
  segments,
  totalTime,
  onStartNewWorkout,
}: WorkoutSummaryProps) {
  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Workout Complete!</h1>
            <p className="text-xl text-muted-foreground">{workoutName}</p>
          </div>

          <Card className="p-6">
            <div className="text-center space-y-2 mb-6">
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-4xl font-bold">{formatTime(totalTime)}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Segments Completed
              </p>
              {segments.map((segment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="font-medium">{segment.name}</span>
                  <Badge variant="secondary">{formatTime(segment.duration)}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Button
            size="lg"
            onClick={onStartNewWorkout}
            className="w-full"
            data-testid="button-start-new-workout"
          >
            Start New Workout
          </Button>
        </div>
      </div>
    </div>
  );
}
