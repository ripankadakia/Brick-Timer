import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface WorkoutSegment {
  name: string;
  duration: number;
}

interface WorkoutCardProps {
  id: string;
  date: Date;
  totalTime: number;
  segments: WorkoutSegment[];
}

export default function WorkoutCard({ id, date, totalTime, segments }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }
  };

  return (
    <Card 
      className="p-4 hover-elevate active-elevate-2 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      data-testid={`card-workout-${id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold" data-testid={`text-total-time-${id}`}>
              {formatTime(totalTime)}
            </h3>
            <Badge variant="secondary" data-testid={`text-segment-count-${id}`}>
              {segments.length} segments
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground" data-testid={`text-date-${id}`}>
            {formatDate(date)} at {date.toLocaleTimeString("en-US", { 
              hour: "numeric", 
              minute: "2-digit" 
            })}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {segments.map((segment, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between"
              data-testid={`segment-${id}-${index}`}
            >
              <span className="text-sm">{segment.name}</span>
              <span className="text-sm font-mono font-semibold tabular-nums">
                {formatTime(segment.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
