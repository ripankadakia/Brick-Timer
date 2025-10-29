import { type Workout, type InsertWorkout, type Segment, type InsertSegment, workouts, segments } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Workout operations
  createWorkout(workout: InsertWorkout, segments: Omit<InsertSegment, "workoutId">[]): Promise<{ workout: Workout; segments: Segment[] }>;
  getWorkouts(): Promise<{ workout: Workout; segments: Segment[] }[]>;
  getWorkoutById(id: string): Promise<{ workout: Workout; segments: Segment[] } | undefined>;
  deleteWorkout(id: string): Promise<void>;
  
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
      name: workout.name,
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

  async deleteWorkout(id: string): Promise<void> {
    this.workouts.delete(id);
    // Delete all segments for this workout
    Array.from(this.segments.entries()).forEach(([segId, seg]) => {
      if (seg.workoutId === id) {
        this.segments.delete(segId);
      }
    });
  }
}

export class DbStorage implements IStorage {
  async createWorkout(
    workout: InsertWorkout,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    return await db.transaction(async (tx) => {
      const [newWorkout] = await tx.insert(workouts).values(workout).returning();

      const segmentsToInsert = segmentInputs.map((seg) => ({
        ...seg,
        workoutId: newWorkout.id,
      }));

      const createdSegments = await tx
        .insert(segments)
        .values(segmentsToInsert)
        .returning();

      return { workout: newWorkout, segments: createdSegments };
    });
  }

  async getWorkouts(): Promise<{ workout: Workout; segments: Segment[] }[]> {
    const allWorkouts = await db
      .select()
      .from(workouts)
      .orderBy(desc(workouts.date));

    const result = await Promise.all(
      allWorkouts.map(async (workout) => {
        const workoutSegments = await db
          .select()
          .from(segments)
          .where(eq(segments.workoutId, workout.id))
          .orderBy(segments.order);

        return { workout, segments: workoutSegments };
      })
    );

    return result;
  }

  async getWorkoutById(id: string): Promise<{ workout: Workout; segments: Segment[] } | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id));

    if (!workout) return undefined;

    const workoutSegments = await db
      .select()
      .from(segments)
      .where(eq(segments.workoutId, id))
      .orderBy(segments.order);

    return { workout, segments: workoutSegments };
  }

  async getSegmentsByName(name: string): Promise<Segment[]> {
    const result = await db
      .select()
      .from(segments)
      .where(sql`lower(${segments.name}) = lower(${name})`)
      .innerJoin(workouts, eq(segments.workoutId, workouts.id))
      .orderBy(desc(workouts.date));

    return result.map((r) => r.segments);
  }

  async deleteWorkout(id: string): Promise<void> {
    // Cascade delete will automatically remove segments
    await db.delete(workouts).where(eq(workouts.id, id));
  }
}

export const storage = new DbStorage();
