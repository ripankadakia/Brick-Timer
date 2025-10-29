import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import IntervalInput from "@/components/IntervalInput";
import ActiveTimer from "@/components/ActiveTimer";
import WorkoutSummary from "@/components/WorkoutSummary";
import { getSavedSegmentNames, saveSegmentName, removeSegmentName } from "@/lib/segmentNames";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function SortableIntervalInput({
  interval,
  onNameChange,
  onRemove,
  onEnter,
  suggestions,
  onRemoveSuggestion,
  setInputRef,
}: {
  interval: Interval;
  onNameChange: (name: string) => void;
  onRemove: () => void;
  onEnter: () => void;
  suggestions: string[];
  onRemoveSuggestion: (name: string) => void;
  setInputRef: (id: string, element: HTMLInputElement | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: interval.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const callbackRef = (element: HTMLInputElement | null) => {
    setInputRef(interval.id, element);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <IntervalInput
        id={interval.id}
        name={interval.name}
        onNameChange={onNameChange}
        onRemove={onRemove}
        onEnter={onEnter}
        suggestions={suggestions}
        onRemoveSuggestion={onRemoveSuggestion}
        dragHandleProps={{ ...attributes, ...listeners }}
        setInputRef={callbackRef}
      />
    </div>
  );
}

export default function TimerPage() {
  const { toast } = useToast();
  const [workoutName, setWorkoutName] = useState("New Workout");
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
  const [summaryData, setSummaryData] = useState<{ workoutName: string; segments: CompletedSegment[]; totalTime: number } | null>(null);
  const [savedSegmentNames, setSavedSegmentNames] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const saveWorkoutMutation = useMutation({
    mutationFn: async (data: { workoutName: string; segments: CompletedSegment[]; totalTime: number }) => {
      return apiRequest("/api/workouts", {
        method: "POST",
        body: JSON.stringify({
          workout: {
            name: data.workoutName,
            totalTime: data.totalTime,
          },
          segments: data.segments.map((seg, index) => ({
            name: seg.name,
            duration: seg.duration,
            order: index,
          })),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Workout Saved",
        description: "Your workout has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSavedSegmentNames(getSavedSegmentNames());
  }, []);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setIntervals((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addInterval = () => {
    const newId = Date.now().toString();
    setIntervals([...intervals, { id: newId, name: "" }]);
    
    // Focus the new input after a brief delay
    setTimeout(() => {
      const input = inputRefs.current.get(newId);
      if (input) {
        input.focus();
      }
    }, 100);
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
      // Save all segment names
      validIntervals.forEach((interval) => {
        saveSegmentName(interval.name);
      });
      setSavedSegmentNames(getSavedSegmentNames());
      
      setIntervals(validIntervals);
      setIsActive(true);
      setIsPaused(false);
      setCurrentSegmentIndex(0);
      setCurrentSegmentTime(0);
      setTotalTime(0);
      setCompletedSegments([]);
    }
  };

  const handleRemoveSuggestion = (name: string) => {
    removeSegmentName(name);
    setSavedSegmentNames(getSavedSegmentNames());
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
        workoutName: workoutName,
        segments: finalSegments,
        totalTime: totalTime
      });
      setShowSummary(true);
    }
  };

  const handleSummaryDone = () => {
    // Save workout to database
    if (summaryData) {
      saveWorkoutMutation.mutate(summaryData);
    }

    // Reset everything to start a new workout
    setShowSummary(false);
    setSummaryData(null);
    setWorkoutName("New Workout");
    setIntervals([{ id: Date.now().toString(), name: "" }]);
    setCurrentSegmentIndex(0);
    setCurrentSegmentTime(0);
    setTotalTime(0);
    setCompletedSegments([]);
  };

  if (showSummary && summaryData) {
    return (
      <WorkoutSummary
        workoutName={summaryData.workoutName}
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
      <div className="mb-6">
        <input
          data-testid="input-workout-name"
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Workout name"
          className="w-full px-3 py-2 text-2xl font-bold border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={intervals.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {intervals.map((interval) => (
              <SortableIntervalInput
                key={interval.id}
                interval={interval}
                onNameChange={(name) => updateIntervalName(interval.id, name)}
                onRemove={() => removeInterval(interval.id)}
                onEnter={addInterval}
                suggestions={savedSegmentNames}
                onRemoveSuggestion={handleRemoveSuggestion}
                setInputRef={(id, element) => {
                  if (element) {
                    inputRefs.current.set(id, element);
                  } else {
                    inputRefs.current.delete(id);
                  }
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
