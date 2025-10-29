import { type Workout, type InsertWorkout, type Segment, type InsertSegment, type User, type UpsertUser, workouts, segments, users } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Reference: blueprint:javascript_log_in_with_replit
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Workout operations
  createWorkout(userId: string, workout: InsertWorkout, segments: Omit<InsertSegment, "workoutId">[]): Promise<{ workout: Workout; segments: Segment[] }>;
  getWorkouts(userId: string): Promise<{ workout: Workout; segments: Segment[] }[]>;
  getWorkoutById(id: string, userId: string): Promise<{ workout: Workout; segments: Segment[] } | undefined>;
  deleteWorkout(id: string, userId: string): Promise<void>;
  
  // Segment operations
  getSegmentsByName(name: string, userId: string): Promise<Segment[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workouts: Map<string, Workout>;
  private segments: Map<string, Segment>;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.segments = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: this.users.get(userData.id!)?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createWorkout(
    userId: string,
    workout: InsertWorkout,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    const workoutId = crypto.randomUUID();
    const newWorkout: Workout = {
      id: workoutId,
      userId,
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

  async getWorkouts(userId: string): Promise<{ workout: Workout; segments: Segment[] }[]> {
    return Array.from(this.workouts.values())
      .filter((workout) => workout.userId === userId)
      .map((workout) => ({
        workout,
        segments: Array.from(this.segments.values())
          .filter((seg) => seg.workoutId === workout.id)
          .sort((a, b) => a.order - b.order),
      }));
  }

  async getWorkoutById(id: string, userId: string): Promise<{ workout: Workout; segments: Segment[] } | undefined> {
    const workout = this.workouts.get(id);
    if (!workout || workout.userId !== userId) return undefined;

    const segments = Array.from(this.segments.values())
      .filter((seg) => seg.workoutId === id)
      .sort((a, b) => a.order - b.order);

    return { workout, segments };
  }

  async getSegmentsByName(name: string, userId: string): Promise<Segment[]> {
    return Array.from(this.segments.values())
      .filter((seg) => {
        const workout = this.workouts.get(seg.workoutId);
        return workout && workout.userId === userId && seg.name.toLowerCase() === name.toLowerCase();
      })
      .sort((a, b) => {
        const workoutA = this.workouts.get(a.workoutId);
        const workoutB = this.workouts.get(b.workoutId);
        if (!workoutA || !workoutB) return 0;
        return workoutB.date.getTime() - workoutA.date.getTime();
      });
  }

  async deleteWorkout(id: string, userId: string): Promise<void> {
    const workout = this.workouts.get(id);
    if (workout && workout.userId === userId) {
      this.workouts.delete(id);
      // Delete all segments for this workout
      Array.from(this.segments.entries()).forEach(([segId, seg]) => {
        if (seg.workoutId === id) {
          this.segments.delete(segId);
        }
      });
    }
  }
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createWorkout(
    userId: string,
    workout: InsertWorkout,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    return await db.transaction(async (tx) => {
      const [newWorkout] = await tx.insert(workouts).values({
        ...workout,
        userId,
      }).returning();

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

  async getWorkouts(userId: string): Promise<{ workout: Workout; segments: Segment[] }[]> {
    const allWorkouts = await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
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

  async getWorkoutById(id: string, userId: string): Promise<{ workout: Workout; segments: Segment[] } | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(sql`${workouts.id} = ${id} AND ${workouts.userId} = ${userId}`);

    if (!workout) return undefined;

    const workoutSegments = await db
      .select()
      .from(segments)
      .where(eq(segments.workoutId, id))
      .orderBy(segments.order);

    return { workout, segments: workoutSegments };
  }

  async getSegmentsByName(name: string, userId: string): Promise<Segment[]> {
    const result = await db
      .select()
      .from(segments)
      .where(sql`lower(${segments.name}) = lower(${name})`)
      .innerJoin(workouts, sql`${segments.workoutId} = ${workouts.id} AND ${workouts.userId} = ${userId}`)
      .orderBy(desc(workouts.date));

    return result.map((r) => r.segments);
  }

  async deleteWorkout(id: string, userId: string): Promise<void> {
    // Cascade delete will automatically remove segments
    await db.delete(workouts).where(sql`${workouts.id} = ${id} AND ${workouts.userId} = ${userId}`);
  }
}

export const storage = new DbStorage();
