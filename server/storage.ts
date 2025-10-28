import { type Workout, type InsertWorkout, type Segment, type InsertSegment } from "@shared/schema";

export interface IStorage {
  // Workout operations
  createWorkout(workout: InsertWorkout, segments: Omit<InsertSegment, "workoutId">[]): Promise<{ workout: Workout; segments: Segment[] }>;
  getWorkouts(): Promise<{ workout: Workout; segments: Segment[] }[]>;
  getWorkoutById(id: string): Promise<{ workout: Workout; segments: Segment[] } | undefined>;
  
  // Segment operations
  getSegmentsByName(name: string): Promise<Segment[]>;
}

export class MemStorage implements IStorage {
  private workouts: Map<string, Workout>;
  private segments: Map<string, Segment>;

  constructor() {
    this.workouts = new Map();
    this.segments = new Map();
  }

  async createWorkout(
    workout: InsertWorkout,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    const workoutId = crypto.randomUUID();
    const newWorkout: Workout = {
      id: workoutId,
      date: new Date(),
      totalTime: workout.totalTime,
    };
    this.workouts.set(workoutId, newWorkout);

    const segments = segmentInputs.map((seg, index) => {
      const segmentId = crypto.randomUUID();
      const segment: Segment = {
        id: segmentId,
        workoutId,
        name: seg.name,
        duration: seg.duration,
        order: seg.order,
      };
      this.segments.set(segmentId, segment);
      return segment;
    });

    return { workout: newWorkout, segments };
  }

  async getWorkouts(): Promise<{ workout: Workout; segments: Segment[] }[]> {
    return Array.from(this.workouts.values()).map((workout) => ({
      workout,
      segments: Array.from(this.segments.values())
        .filter((seg) => seg.workoutId === workout.id)
        .sort((a, b) => a.order - b.order),
    }));
  }

  async getWorkoutById(id: string): Promise<{ workout: Workout; segments: Segment[] } | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;

    const segments = Array.from(this.segments.values())
      .filter((seg) => seg.workoutId === id)
      .sort((a, b) => a.order - b.order);

    return { workout, segments };
  }

  async getSegmentsByName(name: string): Promise<Segment[]> {
    return Array.from(this.segments.values())
      .filter((seg) => seg.name.toLowerCase() === name.toLowerCase())
      .sort((a, b) => {
        const workoutA = this.workouts.get(a.workoutId);
        const workoutB = this.workouts.get(b.workoutId);
        if (!workoutA || !workoutB) return 0;
        return workoutB.date.getTime() - workoutA.date.getTime();
      });
  }
}

export const storage = new MemStorage();
