import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Pause, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActiveTimerProps {
  workoutName: string;
  currentSegmentName: string;
  currentSegmentTime: number;
  totalTime: number;
  upcomingSegments: string[];
  isRunning: boolean;
  onTogglePause: () => void;
  onCompleteSegment: () => void;
  onDiscardWorkout: () => void;
}

export default function ActiveTimer({
  workoutName,
  currentSegmentName,
  currentSegmentTime,
  totalTime,
  upcomingSegments,
  isRunning,
  onTogglePause,
  onCompleteSegment,
  onDiscardWorkout,
}: ActiveTimerProps) {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDiscardConfirm = () => {
    setShowDiscardDialog(false);
    onDiscardWorkout();
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold" data-testid="text-workout-name">{workoutName}</h1>
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

      <div className="flex flex-col gap-3">
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
        
        {!isRunning && (
          <Button
            data-testid="button-discard-workout"
            size="lg"
            variant="destructive"
            onClick={() => setShowDiscardDialog(true)}
            className="w-full"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Discard Workout
          </Button>
        )}
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this workout? All progress will be lost and the workout will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-discard-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              data-testid="button-discard-confirm"
              onClick={handleDiscardConfirm}
              className="bg-destructive text-destructive-foreground hover-elevate"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
