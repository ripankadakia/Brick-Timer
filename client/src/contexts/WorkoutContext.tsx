import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

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

interface CompletedWorkout {
  workoutName: string;
  segments: CompletedSegment[];
  totalTime: number;
}

interface WorkoutState {
  workoutName: string;
  intervals: Interval[];
  isActive: boolean;
  isPaused: boolean;
  currentSegmentIndex: number;
  currentSegmentTime: number;
  totalTime: number;
  completedSegments: CompletedSegment[];
  showSummary: boolean;
}

interface WorkoutContextType extends WorkoutState {
  setWorkoutName: (name: string) => void;
  setIntervals: (intervals: Interval[]) => void;
  startWorkout: (name: string, intervals: Interval[]) => void;
  togglePause: () => void;
  completeSegment: () => CompletedWorkout | null;
  resetWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [workoutName, setWorkoutName] = useState("");
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentSegmentTime, setCurrentSegmentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [completedSegments, setCompletedSegments] = useState<CompletedSegment[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSegmentTime((prev) => prev + 1);
        setTotalTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const startWorkout = (name: string, validIntervals: Interval[]) => {
    setWorkoutName(name);
    setIntervals(validIntervals);
    setIsActive(true);
    setIsPaused(false);
    setCurrentSegmentIndex(0);
    setCurrentSegmentTime(0);
    setTotalTime(0);
    setCompletedSegments([]);
    setShowSummary(false); // Ensure summary is hidden when starting a new workout
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const completeSegment = (): CompletedWorkout | null => {
    // Add current segment to completed list
    const currentInterval = intervals[currentSegmentIndex];
    if (currentInterval) {
      setCompletedSegments((prev) => [
        ...prev,
        { name: currentInterval.name, duration: currentSegmentTime },
      ]);
    }

    // Check if there are more segments
    if (currentSegmentIndex < intervals.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      setCurrentSegmentTime(0);
      return null;
    } else {
      // Workout complete - show summary instead of resetting
      const finalSegments = [
        ...completedSegments,
        { name: currentInterval.name, duration: currentSegmentTime },
      ];
      const completedWorkout = {
        workoutName,
        segments: finalSegments,
        totalTime,
      };

      // Stop the workout and show summary
      setIsActive(false);
      setIsPaused(false);
      setShowSummary(true);

      return completedWorkout;
    }
  };

  const resetWorkout = () => {
    setWorkoutName("");
    setIntervals([]);
    setIsActive(false);
    setIsPaused(false);
    setCurrentSegmentIndex(0);
    setCurrentSegmentTime(0);
    setTotalTime(0);
    setCompletedSegments([]);
    setShowSummary(false);
  };

  return (
    <WorkoutContext.Provider
      value={{
        workoutName,
        intervals,
        isActive,
        isPaused,
        currentSegmentIndex,
        currentSegmentTime,
        totalTime,
        completedSegments,
        showSummary, // Include showSummary in the context value
        setWorkoutName,
        setIntervals,
        startWorkout,
        togglePause,
        completeSegment,
        resetWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}