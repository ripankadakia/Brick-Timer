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

interface WorkoutState {
  workoutName: string;
  intervals: Interval[];
  isActive: boolean;
  isPaused: boolean;
  currentSegmentIndex: number;
  currentSegmentTime: number;
  totalTime: number;
  completedSegments: ActiveSegment[];
  showSummary: boolean;
  summaryData: { workoutName: string; segments: CompletedSegment[]; totalTime: number } | null;
}

interface WorkoutContextType extends WorkoutState {
  setWorkoutName: (name: string) => void;
  setIntervals: (intervals: Interval[]) => void;
  startWorkout: (name: string, intervals: Interval[]) => void;
  togglePause: () => void;
  completeSegment: () => void;
  finishWorkout: () => void;
  resetWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [workoutName, setWorkoutName] = useState("New Workout");
  const [intervals, setIntervals] = useState<Interval[]>([{ id: "1", name: "" }]);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentSegmentTime, setCurrentSegmentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [completedSegments, setCompletedSegments] = useState<ActiveSegment[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{ workoutName: string; segments: CompletedSegment[]; totalTime: number } | null>(null);
  
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

  const finishWorkout = () => {
    setShowSummary(false);
    setSummaryData(null);
  };

  const resetWorkout = () => {
    setWorkoutName("New Workout");
    setIntervals([{ id: Date.now().toString(), name: "" }]);
    setIsActive(false);
    setIsPaused(false);
    setCurrentSegmentIndex(0);
    setCurrentSegmentTime(0);
    setTotalTime(0);
    setCompletedSegments([]);
    setShowSummary(false);
    setSummaryData(null);
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
        showSummary,
        summaryData,
        setWorkoutName,
        setIntervals,
        startWorkout,
        togglePause,
        completeSegment,
        finishWorkout,
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
