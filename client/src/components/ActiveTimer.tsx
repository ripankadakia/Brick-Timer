import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActiveTimerProps {
  currentSegmentName: string;
  currentSegmentTime: number;
  totalTime: number;
  upcomingSegments: string[];
  isRunning: boolean;
  onTogglePause: () => void;
  onCompleteSegment: () => void;
}

export default function ActiveTimer({
  currentSegmentName,
  currentSegmentTime,
  totalTime,
  upcomingSegments,
  isRunning,
  onTogglePause,
  onCompleteSegment,
}: ActiveTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Active Workout</h1>
        <Badge variant="secondary" data-testid="text-total-time">
          Total: {formatTime(totalTime)}
        </Badge>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" data-testid="text-current-segment">
            {currentSegmentName}
          </h2>
          <div 
            className="text-7xl font-bold tabular-nums font-mono" 
            data-testid="text-segment-time"
          >
            {formatTime(currentSegmentTime)}
          </div>
        </div>

        {upcomingSegments.length > 0 && (
          <Card className="p-4 w-full">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Up Next
            </h3>
            <div className="flex flex-col gap-1">
              {upcomingSegments.map((segment, index) => (
                <div 
                  key={index} 
                  className="text-sm"
                  data-testid={`text-upcoming-${index}`}
                >
                  {segment}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          data-testid="button-pause"
          size="lg"
          variant="outline"
          onClick={onTogglePause}
          className="flex-1"
        >
          {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
          {isRunning ? "Pause" : "Resume"}
        </Button>
        <Button
          data-testid="button-complete-segment"
          size="lg"
          onClick={onCompleteSegment}
          className="flex-1"
        >
          <Check className="w-5 h-5 mr-2" />
          Complete Segment
        </Button>
      </div>
    </div>
  );
}
