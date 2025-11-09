import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import IntervalInput from "@/components/IntervalInput";
import ActiveTimer from "@/components/ActiveTimer";
import WorkoutSummary from "@/components/WorkoutSummary";
import { getSavedSegmentNames, saveSegmentName, removeSegmentName } from "@/lib/segmentNames";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutTemplate, TemplateSegment } from "@shared/schema";
import { useWorkout } from "@/contexts/WorkoutContext";
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
  
  // Workout context for active workout state
  const workout = useWorkout();
  
  // Local state for setup UI (before starting)
  const [setupWorkoutName, setSetupWorkoutName] = useState("New Workout");
  const [setupIntervals, setSetupIntervals] = useState<Interval[]>([
    { id: "1", name: "" },
  ]);
  const [savedSegmentNames, setSavedSegmentNames] = useState<string[]>([]);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Fetch workout templates
  const { data: templates } = useQuery<{ template: WorkoutTemplate; segments: TemplateSegment[] }[]>({
    queryKey: ["/api/templates"],
  });

  const saveWorkoutMutation = useMutation({
    mutationFn: async (data: { workoutName: string; segments: CompletedSegment[]; totalTime: number }) => {
      return apiRequest("POST", "/api/workouts", {
        workout: {
          name: data.workoutName,
          totalTime: data.totalTime,
        },
        segments: data.segments.map((seg, index) => ({
          name: seg.name,
          duration: seg.duration,
          order: index,
        })),
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

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; segments: Interval[] }) => {
      return apiRequest("POST", "/api/templates", {
        name: data.name,
        segments: data.segments.map((seg, index) => ({
          name: seg.name,
          duration: 0,
          order: index,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSetupIntervals((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addInterval = () => {
    const newId = Date.now().toString();
    setSetupIntervals([...setupIntervals, { id: newId, name: "" }]);
    
    setTimeout(() => {
      const input = inputRefs.current.get(newId);
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const removeInterval = (id: string) => {
    setSetupIntervals(setupIntervals.filter((interval) => interval.id !== id));
  };

  const updateIntervalName = (id: string, name: string) => {
    setSetupIntervals(
      setupIntervals.map((interval) =>
        interval.id === id ? { ...interval, name } : interval
      )
    );
  };

  const handleStartWorkout = () => {
    const validIntervals = setupIntervals.filter((i) => i.name.trim());
    if (validIntervals.length >= 2) {
      // Save all segment names
      validIntervals.forEach((interval) => {
        saveSegmentName(interval.name);
      });
      setSavedSegmentNames(getSavedSegmentNames());
      
      // Save as template
      if (setupWorkoutName && setupWorkoutName.trim()) {
        saveTemplateMutation.mutate({
          name: setupWorkoutName.trim(),
          segments: validIntervals,
        });
      }
      
      // Start workout in context
      workout.startWorkout(setupWorkoutName, validIntervals);
    }
  };

  const handleWorkoutNameChange = (name: string) => {
    setSetupWorkoutName(name);
    
    // Check if this matches a template
    const matchingTemplate = templates?.find(t => t.template.name === name);
    if (matchingTemplate) {
      const templateIntervals = matchingTemplate.segments.map(seg => ({
        id: Date.now().toString() + Math.random(),
        name: seg.name,
      }));
      setSetupIntervals(templateIntervals.length > 0 ? templateIntervals : [{ id: Date.now().toString(), name: "" }]);
    }
  };

  const handleRemoveSuggestion = (name: string) => {
    removeSegmentName(name);
    setSavedSegmentNames(getSavedSegmentNames());
  };

  const handleCompleteSegment = () => {
    const completedWorkout = workout.completeSegment();
    
    // If workout is complete, save it automatically
    if (completedWorkout) {
      saveWorkoutMutation.mutate(completedWorkout);
      
      // Reset setup state
      setSetupWorkoutName("New Workout");
      setSetupIntervals([{ id: Date.now().toString(), name: "" }]);
    }
  };

  const handleDiscardWorkout = () => {
    // Discard workout in context (doesn't save)
    workout.discardWorkout();
    
    // Reset setup state
    setSetupWorkoutName("New Workout");
    setSetupIntervals([{ id: Date.now().toString(), name: "" }]);
  };

  // Show active timer view
  if (workout.isActive) {
    return (
      <ActiveTimer
        workoutName={workout.workoutName}
        currentSegmentName={workout.intervals[workout.currentSegmentIndex]?.name || ""}
        currentSegmentTime={workout.currentSegmentTime}
        totalTime={workout.totalTime}
        upcomingSegments={workout.intervals
          .slice(workout.currentSegmentIndex + 1)
          .map((i) => i.name)}
        isRunning={!workout.isPaused}
        onTogglePause={workout.togglePause}
        onCompleteSegment={handleCompleteSegment}
        onDiscardWorkout={handleDiscardWorkout}
      />
    );
  }

  // Show setup view
  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <div className="mb-6">
        <input
          data-testid="input-workout-name"
          type="text"
          value={setupWorkoutName}
          onChange={(e) => handleWorkoutNameChange(e.target.value)}
          placeholder="Workout name"
          list="workout-templates"
          className="w-full px-3 py-2 text-2xl font-bold border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <datalist id="workout-templates">
          {templates?.map((t) => (
            <option key={t.template.id} value={t.template.name} />
          ))}
        </datalist>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={setupIntervals.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {setupIntervals.map((interval) => (
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
          onClick={handleStartWorkout}
          disabled={setupIntervals.filter((i) => i.name.trim()).length < 2}
          className="w-full"
        >
          Start Workout
        </Button>
      </div>
    </div>
  );
}
