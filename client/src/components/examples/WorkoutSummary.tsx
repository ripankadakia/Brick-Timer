import WorkoutSummary from '../WorkoutSummary';

export default function WorkoutSummaryExample() {
  return (
    <WorkoutSummary
      workoutName="Sample Workout"
      segments={[
        { name: "Run", duration: 180 },
        { name: "Bike", duration: 240 },
        { name: "Row", duration: 150 },
        { name: "Run", duration: 150 }
      ]}
      totalTime={720}
      onStartNewWorkout={() => console.log('Start new workout clicked')}
    />
  );
}
