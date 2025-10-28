import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import IntervalInput from "@/components/IntervalInput";
import ActiveTimer from "@/components/ActiveTimer";
import WorkoutSummary from "@/components/WorkoutSummary";

interface Interval {
  id: string;
  name: string;
}

interface ActiveSegment {
  name: string;
  startTime: number;
}

interface CompletedSegment {
  name: string;
  duration: number;
}

export default function TimerPage() {
  const [intervals, setIntervals] = useState<Interval[]>([
    { id: "1", name: "" },
  ]);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentSegmentTime, setCurrentSegmentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [completedSegments, setCompletedSegments] = useState<ActiveSegment[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{ segments: CompletedSegment[]; totalTime: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSegmentTime((prev) => prev + 1);
        setTotalTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const addInterval = () => {
    setIntervals([...intervals, { id: Date.now().toString(), name: "" }]);
  };

  const removeInterval = (id: string) => {
    setIntervals(intervals.filter((interval) => interval.id !== id));
  };

  const updateIntervalName = (id: string, name: string) => {
    setIntervals(
      intervals.map((interval) =>
        interval.id === id ? { ...interval, name } : interval
      )
    );
  };

  const startWorkout = () => {
    const validIntervals = intervals.filter((i) => i.name.trim());
    if (validIntervals.length >= 2) {
      setIntervals(validIntervals);
      setIsActive(true);
      setIsPaused(false);
      setCurrentSegmentIndex(0);
      setCurrentSegmentTime(0);
      setTotalTime(0);
      setCompletedSegments([]);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const completeSegment = () => {
    const currentSegment = intervals[currentSegmentIndex];
    const updatedCompletedSegments = [
      ...completedSegments,
      { name: currentSegment.name, startTime: currentSegmentTime },
    ];
    setCompletedSegments(updatedCompletedSegments);

    if (currentSegmentIndex < intervals.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setCurrentSegmentTime(0);
    } else {
      // Workout complete - show summary
      setIsActive(false);
      setIsPaused(false);
      
      const finalSegments = updatedCompletedSegments.map(seg => ({
        name: seg.name,
        duration: seg.startTime
      }));
      
      setSummaryData({
        segments: finalSegments,
        totalTime: totalTime
      });
      setShowSummary(true);
    }
  };

  const handleSummaryDone = () => {
    // Reset everything to start a new workout
    setShowSummary(false);
    setSummaryData(null);
    setIntervals([{ id: Date.now().toString(), name: "" }]);
    setCurrentSegmentIndex(0);
    setCurrentSegmentTime(0);
    setTotalTime(0);
    setCompletedSegments([]);
  };

  if (showSummary && summaryData) {
    return (
      <WorkoutSummary
        segments={summaryData.segments}
        totalTime={summaryData.totalTime}
        onDone={handleSummaryDone}
      />
    );
  }

  if (isActive) {
    return (
      <ActiveTimer
        currentSegmentName={intervals[currentSegmentIndex].name}
        currentSegmentTime={currentSegmentTime}
        totalTime={totalTime}
        upcomingSegments={intervals
          .slice(currentSegmentIndex + 1)
          .map((i) => i.name)}
        isRunning={!isPaused}
        onTogglePause={togglePause}
        onCompleteSegment={completeSegment}
      />
    );
  }

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">New Workout</h1>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {intervals.map((interval) => (
          <IntervalInput
            key={interval.id}
            id={interval.id}
            name={interval.name}
            onNameChange={(name) => updateIntervalName(interval.id, name)}
            onRemove={() => removeInterval(interval.id)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          data-testid="button-add-interval"
          variant="outline"
          onClick={addInterval}
          className="w-full"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Interval
        </Button>
        <Button
          data-testid="button-start-workout"
          size="lg"
          onClick={startWorkout}
          disabled={intervals.filter((i) => i.name.trim()).length < 2}
          className="w-full"
        >
          Start Workout
        </Button>
      </div>
    </div>
  );
}
