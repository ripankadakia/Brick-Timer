import WorkoutCard from "@/components/WorkoutCard";

export default function HistoryPage() {
  //todo: remove mock functionality
  const mockWorkouts = [
    {
      id: "1",
      date: new Date(),
      totalTime: 720,
      segments: [
        { name: "Run", duration: 180 },
        { name: "Bike", duration: 240 },
        { name: "Row", duration: 150 },
        { name: "Run", duration: 150 },
      ],
    },
    {
      id: "2",
      date: new Date(Date.now() - 86400000),
      totalTime: 650,
      segments: [
        { name: "Run", duration: 200 },
        { name: "Bike", duration: 220 },
        { name: "Row", duration: 130 },
        { name: "Run", duration: 100 },
      ],
    },
    {
      id: "3",
      date: new Date(Date.now() - 86400000 * 2),
      totalTime: 780,
      segments: [
        { name: "Run", duration: 190 },
        { name: "Bike", duration: 250 },
        { name: "Row", duration: 170 },
        { name: "Run", duration: 170 },
      ],
    },
  ];

  if (mockWorkouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 pb-24">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Workouts Yet</h2>
          <p className="text-muted-foreground mb-6">
            Start your first workout to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Workout History</h1>

      <div className="flex-1 overflow-y-auto space-y-3">
        {mockWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            id={workout.id}
            date={workout.date}
            totalTime={workout.totalTime}
            segments={workout.segments}
          />
        ))}
      </div>
    </div>
  );
}
