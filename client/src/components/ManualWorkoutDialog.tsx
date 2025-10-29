import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ManualSegment {
  id: string;
  name: string;
  duration: number;
}

interface ManualWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editWorkout?: {
    id: string;
    name: string;
    date: Date;
    totalTime: number;
    segments: { name: string; duration: number }[];
  };
}

export default function ManualWorkoutDialog({
  open,
  onOpenChange,
  editWorkout,
}: ManualWorkoutDialogProps) {
  const { toast } = useToast();
  const [workoutName, setWorkoutName] = useState(editWorkout?.name || "");
  const [workoutDate, setWorkoutDate] = useState(
    editWorkout
      ? new Date(editWorkout.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [segments, setSegments] = useState<ManualSegment[]>(
    editWorkout
      ? editWorkout.segments.map((seg, idx) => ({
          id: `${idx}`,
          name: seg.name,
          duration: Math.round(seg.duration / 60),
        }))
      : [{ id: "1", name: "", duration: 0 }]
  );

  const createWorkoutMutation = useMutation({
    mutationFn: async (data: {
      workoutName: string;
      workoutDate: string;
      segments: ManualSegment[];
    }) => {
      const totalTime = data.segments.reduce(
        (sum, seg) => sum + seg.duration * 60,
        0
      );
      return apiRequest("POST", "/api/workouts", {
        workout: {
          name: data.workoutName,
          date: new Date(data.workoutDate).toISOString(),
          totalTime,
        },
        segments: data.segments.map((seg, index) => ({
          name: seg.name,
          duration: seg.duration * 60,
          order: index,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Workout Added",
        description: "Your workout has been added successfully.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateWorkoutMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      workoutName: string;
      workoutDate: string;
      segments: ManualSegment[];
    }) => {
      const totalTime = data.segments.reduce(
        (sum, seg) => sum + seg.duration * 60,
        0
      );
      return apiRequest("PATCH", `/api/workouts/${data.id}`, {
        workout: {
          name: data.workoutName,
          date: new Date(data.workoutDate).toISOString(),
          totalTime,
        },
        segments: data.segments.map((seg, index) => ({
          name: seg.name,
          duration: seg.duration * 60,
          order: index,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Workout Updated",
        description: "Your workout has been updated successfully.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    if (!editWorkout) {
      setWorkoutName("");
      setWorkoutDate(new Date().toISOString().slice(0, 16));
      setSegments([{ id: "1", name: "", duration: 0 }]);
    }
  };

  const addSegment = () => {
    setSegments([
      ...segments,
      { id: Date.now().toString(), name: "", duration: 0 },
    ]);
  };

  const removeSegment = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter((seg) => seg.id !== id));
    }
  };

  const updateSegmentName = (id: string, name: string) => {
    setSegments(segments.map((seg) => (seg.id === id ? { ...seg, name } : seg)));
  };

  const updateSegmentDuration = (id: string, duration: number) => {
    setSegments(
      segments.map((seg) => (seg.id === id ? { ...seg, duration } : seg))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSegments = segments.filter(
      (seg) => seg.name.trim() && seg.duration > 0
    );

    if (!workoutName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a workout name.",
        variant: "destructive",
      });
      return;
    }

    if (validSegments.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one segment with a name and duration.",
        variant: "destructive",
      });
      return;
    }

    if (editWorkout) {
      updateWorkoutMutation.mutate({
        id: editWorkout.id,
        workoutName,
        workoutDate,
        segments: validSegments,
      });
    } else {
      createWorkoutMutation.mutate({
        workoutName,
        workoutDate,
        segments: validSegments,
      });
    }
  };

  const isPending =
    createWorkoutMutation.isPending || updateWorkoutMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editWorkout ? "Edit Workout" : "Add Manual Workout"}
          </DialogTitle>
          <DialogDescription>
            {editWorkout
              ? "Update the workout details below."
              : "Enter the workout details from your session."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workout-name">Workout Name</Label>
            <Input
              id="workout-name"
              data-testid="input-manual-workout-name"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Morning Run"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-date">Date & Time</Label>
            <Input
              id="workout-date"
              data-testid="input-manual-workout-date"
              type="datetime-local"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Segments</Label>
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className="flex gap-2 items-start"
                data-testid={`manual-segment-${index}`}
              >
                <div className="flex-1 space-y-2">
                  <Input
                    data-testid={`input-manual-segment-name-${index}`}
                    placeholder="Segment name"
                    value={segment.name}
                    onChange={(e) =>
                      updateSegmentName(segment.id, e.target.value)
                    }
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Input
                    data-testid={`input-manual-segment-duration-${index}`}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Min"
                    value={segment.duration || ""}
                    onChange={(e) =>
                      updateSegmentDuration(
                        segment.id,
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
                {segments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSegment(segment.id)}
                    data-testid={`button-remove-segment-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSegment}
              className="w-full"
              data-testid="button-add-manual-segment"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Segment
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={isPending}
              data-testid="button-cancel-manual-workout"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-save-manual-workout"
            >
              {isPending ? "Saving..." : editWorkout ? "Update" : "Add Workout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
