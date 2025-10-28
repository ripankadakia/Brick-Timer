import WorkoutCard from '../WorkoutCard';

export default function WorkoutCardExample() {
  return (
    <WorkoutCard 
      id="1"
      date={new Date()}
      totalTime={720}
      segments={[
        { name: "Run", duration: 180 },
        { name: "Bike", duration: 240 },
        { name: "Row", duration: 150 },
        { name: "Run", duration: 150 }
      ]}
    />
  );
}
