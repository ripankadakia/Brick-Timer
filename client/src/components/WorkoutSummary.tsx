import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface CompletedSegment {
  name: string;
  duration: number;
}

interface WorkoutSummaryProps {
  segments: CompletedSegment[];
  totalTime: number;
  onDone: () => void;
}

export default function WorkoutSummary({
  segments,
  totalTime,
  onDone,
}: WorkoutSummaryProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <div className="flex flex-col items-center justify-center py-8">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Workout Complete!</h1>
        <p className="text-muted-foreground">Great job finishing your workout</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-muted-foreground mb-2">Total Time</div>
          <div 
            className="text-5xl font-bold tabular-nums font-mono"
            data-testid="text-summary-total-time"
          >
            {formatTime(totalTime)}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold mb-3">Segment Breakdown</h3>
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="flex items-center justify-between"
                data-testid={`summary-segment-${index}`}
              >
                <span className="text-base">{segment.name}</span>
                <span className="text-lg font-mono font-semibold tabular-nums">
                  {formatTime(segment.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Button
        data-testid="button-done"
        size="lg"
        onClick={onDone}
        className="w-full"
      >
        Done
      </Button>
    </div>
  );
}
