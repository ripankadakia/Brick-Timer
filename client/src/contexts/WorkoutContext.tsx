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
  completedSegments: ActiveSegment[];
}

interface WorkoutContextType extends WorkoutState {
  setWorkoutName: (name: string) => void;
  setIntervals: (intervals: Interval[]) => void;
  startWorkout: (name: string, intervals: Interval[]) => void;
  togglePause: () => void;
  completeSegment: () => CompletedWorkout | null;
  discardWorkout: () => void;
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
  const [completedSegments, setCompletedSegments] = useState<ActiveSegment[]>([]);

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
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const completeSegment = (): CompletedWorkout | null => {
    const currentSegment = intervals[currentSegmentIndex];
    const updatedCompletedSegments = [
      ...completedSegments,
      { name: currentSegment.name, startTime: currentSegmentTime },
    ];
    setCompletedSegments(updatedCompletedSegments);

    if (currentSegmentIndex < intervals.length - 1) {
      // Move to next segment
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setCurrentSegmentTime(0);
      return null;
    } else {
      // Workout complete - return data and reset
      const finalSegments = updatedCompletedSegments.map(seg => ({
        name: seg.name,
        duration: seg.startTime
      }));
      
      const completedWorkout: CompletedWorkout = {
        workoutName: workoutName,
        segments: finalSegments,
        totalTime: totalTime
      };
      
      // Reset workout state
      setIsActive(false);
      setIsPaused(false);
      setCurrentSegmentIndex(0);
      setCurrentSegmentTime(0);
      setTotalTime(0);
      setCompletedSegments([]);
      
      return completedWorkout;
    }
  };

  const discardWorkout = () => {
    // Discard is same as reset - clear all workout state
    resetWorkout();
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
        setWorkoutName,
        setIntervals,
        startWorkout,
        togglePause,
        completeSegment,
        discardWorkout,
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