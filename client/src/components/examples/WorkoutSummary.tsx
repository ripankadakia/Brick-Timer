import WorkoutSummary from '../WorkoutSummary';

export default function WorkoutSummaryExample() {
  return (
    <WorkoutSummary 
      segments={[
        { name: "Run", duration: 180 },
        { name: "Bike", duration: 240 },
        { name: "Row", duration: 150 },
        { name: "Run", duration: 150 }
      ]}
      totalTime={720}
      onDone={() => console.log('Done clicked')}
    />
  );
}
