import WorkoutCard from "@/components/WorkoutCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workout, Segment } from "@shared/schema";

export default function HistoryPage() {
  const { toast } = useToast();
  const { data: workouts, isLoading } = useQuery<{ workout: Workout; segments: Segment[] }[]>({
    queryKey: ["/api/workouts"],
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      return apiRequest("DELETE", `/api/workouts/${workoutId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Workout Deleted",
        description: "The workout has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 pb-24">
        <div className="text-center">
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    );
  }

  if (!workouts || workouts.length === 0) {
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
        {workouts.map(({ workout, segments }) => (
          <WorkoutCard
            key={workout.id}
            id={workout.id}
            name={workout.name}
            date={new Date(workout.date)}
            totalTime={workout.totalTime}
            segments={segments.map(seg => ({
              name: seg.name,
              duration: seg.duration,
            }))}
            onDelete={() => deleteWorkoutMutation.mutate(workout.id)}
          />
        ))}
      </div>
    </div>
  );
}
