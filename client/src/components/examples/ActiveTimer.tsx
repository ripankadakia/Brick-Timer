import { useState } from 'react';
import ActiveTimer from '../ActiveTimer';

export default function ActiveTimerExample() {
  const [isRunning, setIsRunning] = useState(true);

  return (
    <ActiveTimer
      workoutName="Sample Workout"
      currentSegmentName="Run"
      currentSegmentTime={127}
      totalTime={245}
      upcomingSegments={["Bike", "Row", "Run"]}
      isRunning={isRunning}
      onTogglePause={() => setIsRunning(!isRunning)}
      onCompleteSegment={() => console.log('Segment completed')}
      onDiscardWorkout={() => console.log('Workout discarded')}
    />
  );
}
