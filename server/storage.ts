import { type Workout, type InsertWorkout, type UpdateWorkout, type Segment, type InsertSegment, type User, type UpsertUser, type WorkoutTemplate, type InsertWorkoutTemplate, type TemplateSegment, type InsertTemplateSegment, workouts, segments, users, workoutTemplates, templateSegments } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

// Reference: blueprint:javascript_log_in_with_replit
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Workout operations
  createWorkout(userId: string, workout: UpdateWorkout, segments: Omit<InsertSegment, "workoutId">[]): Promise<{ workout: Workout; segments: Segment[] }>;
  getWorkouts(userId: string): Promise<{ workout: Workout; segments: Segment[] }[]>;
  getWorkoutById(id: string, userId: string): Promise<{ workout: Workout; segments: Segment[] } | undefined>;
  updateWorkout(id: string, userId: string, workout: Partial<UpdateWorkout>, segments: Omit<InsertSegment, "workoutId">[]): Promise<{ workout: Workout; segments: Segment[] }>;
  deleteWorkout(id: string, userId: string): Promise<void>;
  
  // Segment operations
  getSegmentsByName(name: string, userId: string): Promise<Segment[]>;
  
  // Template operations
  createOrUpdateTemplate(userId: string, name: string, segments: Omit<InsertTemplateSegment, "templateId">[]): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] }>;
  getTemplates(userId: string): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] }[]>;
  getTemplateByName(name: string, userId: string): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] } | undefined>;
  deleteTemplate(id: string, userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workouts: Map<string, Workout>;
  private segments: Map<string, Segment>;
  private templates: Map<string, WorkoutTemplate>;
  private templateSegs: Map<string, TemplateSegment>;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.segments = new Map();
    this.templates = new Map();
    this.templateSegs = new Map();
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
    workout: UpdateWorkout,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    const workoutId = crypto.randomUUID();
    const workoutDate = workout.date 
      ? (typeof workout.date === 'string' ? new Date(workout.date) : workout.date)
      : new Date();
    const newWorkout: Workout = {
      id: workoutId,
      userId,
      name: workout.name,
      date: workoutDate,
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

  async updateWorkout(
    id: string,
    userId: string,
    workoutUpdate: Partial<UpdateWorkout>,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    const workout = this.workouts.get(id);
    if (!workout || workout.userId !== userId) {
      throw new Error("Workout not found");
    }

    // Convert date string to Date if provided
    const updateData: Partial<Workout> = { ...workoutUpdate } as Partial<Workout>;
    if (workoutUpdate.date) {
      updateData.date =
        typeof workoutUpdate.date === "string"
          ? new Date(workoutUpdate.date)
          : workoutUpdate.date;
    }

    // Update workout
    const updatedWorkout: Workout = {
      ...workout,
      ...updateData,
    };
    this.workouts.set(id, updatedWorkout);

    // Delete old segments
    Array.from(this.segments.entries()).forEach(([segId, seg]) => {
      if (seg.workoutId === id) {
        this.segments.delete(segId);
      }
    });

    // Create new segments
    const segments = segmentInputs.map((seg) => {
      const segmentId = crypto.randomUUID();
      const segment: Segment = {
        id: segmentId,
        workoutId: id,
        name: seg.name,
        duration: seg.duration,
        order: seg.order,
      };
      this.segments.set(segmentId, segment);
      return segment;
    });

    return { workout: updatedWorkout, segments };
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

  async createOrUpdateTemplate(
    userId: string,
    name: string,
    segmentInputs: Omit<InsertTemplateSegment, "templateId">[]
  ): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] }> {
    // Find existing template by name
    const existing = Array.from(this.templates.values()).find(
      (t) => t.userId === userId && t.name === name
    );

    let template: WorkoutTemplate;
    if (existing) {
      // Update existing
      template = {
        ...existing,
        updatedAt: new Date(),
      };
      this.templates.set(existing.id, template);
      
      // Delete old template segments
      Array.from(this.templateSegs.entries()).forEach(([segId, seg]) => {
        if (seg.templateId === existing.id) {
          this.templateSegs.delete(segId);
        }
      });
    } else {
      // Create new
      const templateId = crypto.randomUUID();
      template = {
        id: templateId,
        userId,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.templates.set(templateId, template);
    }

    // Create template segments
    const segments = segmentInputs.map((seg) => {
      const segmentId = crypto.randomUUID();
      const segment: TemplateSegment = {
        id: segmentId,
        templateId: template.id,
        name: seg.name,
        duration: seg.duration,
        order: seg.order,
      };
      this.templateSegs.set(segmentId, segment);
      return segment;
    });

    return { template, segments };
  }

  async getTemplates(userId: string): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] }[]> {
    return Array.from(this.templates.values())
      .filter((template) => template.userId === userId)
      .map((template) => ({
        template,
        segments: Array.from(this.templateSegs.values())
          .filter((seg) => seg.templateId === template.id)
          .sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => b.template.updatedAt.getTime() - a.template.updatedAt.getTime());
  }

  async getTemplateByName(name: string, userId: string): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] } | undefined> {
    const template = Array.from(this.templates.values()).find(
      (t) => t.userId === userId && t.name === name
    );
    if (!template) return undefined;

    const segments = Array.from(this.templateSegs.values())
      .filter((seg) => seg.templateId === template.id)
      .sort((a, b) => a.order - b.order);

    return { template, segments };
  }

  async deleteTemplate(id: string, userId: string): Promise<void> {
    const template = this.templates.get(id);
    if (template && template.userId === userId) {
      this.templates.delete(id);
      // Delete all template segments
      Array.from(this.templateSegs.entries()).forEach(([segId, seg]) => {
        if (seg.templateId === id) {
          this.templateSegs.delete(segId);
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
    workout: UpdateWorkout,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    return await db.transaction(async (tx) => {
      const workoutData = {
        ...workout,
        userId,
        date: workout.date 
          ? (typeof workout.date === 'string' ? new Date(workout.date) : workout.date)
          : undefined,
      };
      const [newWorkout] = await tx.insert(workouts).values(workoutData).returning();

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

  async updateWorkout(
    id: string,
    userId: string,
    workoutUpdate: Partial<UpdateWorkout>,
    segmentInputs: Omit<InsertSegment, "workoutId">[]
  ): Promise<{ workout: Workout; segments: Segment[] }> {
    return await db.transaction(async (tx) => {
      // Verify ownership and get current workout
      const [existingWorkout] = await tx
        .select()
        .from(workouts)
        .where(sql`${workouts.id} = ${id} AND ${workouts.userId} = ${userId}`);

      if (!existingWorkout) {
        throw new Error("Workout not found");
      }

      // Convert date string to Date if provided
      const updateData = {
        ...workoutUpdate,
        date: workoutUpdate.date 
          ? (typeof workoutUpdate.date === 'string' ? new Date(workoutUpdate.date) : workoutUpdate.date)
          : undefined,
      };

      // Update workout
      const [updatedWorkout] = await tx
        .update(workouts)
        .set(updateData)
        .where(sql`${workouts.id} = ${id}`)
        .returning();

      // Delete old segments
      await tx.delete(segments).where(eq(segments.workoutId, id));

      // Insert new segments
      const segmentsToInsert = segmentInputs.map((seg) => ({
        ...seg,
        workoutId: id,
      }));

      const updatedSegments = await tx
        .insert(segments)
        .values(segmentsToInsert)
        .returning();

      return { workout: updatedWorkout, segments: updatedSegments };
    });
  }

  async deleteWorkout(id: string, userId: string): Promise<void> {
    // Cascade delete will automatically remove segments
    await db.delete(workouts).where(sql`${workouts.id} = ${id} AND ${workouts.userId} = ${userId}`);
  }

  async createOrUpdateTemplate(
    userId: string,
    name: string,
    segmentInputs: Omit<InsertTemplateSegment, "templateId">[]
  ): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] }> {
    return await db.transaction(async (tx) => {
      // Check if template already exists
      const [existing] = await tx
        .select()
        .from(workoutTemplates)
        .where(and(eq(workoutTemplates.userId, userId), eq(workoutTemplates.name, name)));

      let template: WorkoutTemplate;
      if (existing) {
        // Update existing template
        [template] = await tx
          .update(workoutTemplates)
          .set({ updatedAt: new Date() })
          .where(eq(workoutTemplates.id, existing.id))
          .returning();

        // Delete old template segments
        await tx.delete(templateSegments).where(eq(templateSegments.templateId, existing.id));
      } else {
        // Create new template
        [template] = await tx
          .insert(workoutTemplates)
          .values({ userId, name })
          .returning();
      }

      // Insert template segments
      const segmentsToInsert = segmentInputs.map((seg) => ({
        ...seg,
        templateId: template.id,
      }));

      const createdSegments = await tx
        .insert(templateSegments)
        .values(segmentsToInsert)
        .returning();

      return { template, segments: createdSegments };
    });
  }

  async getTemplates(userId: string): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] }[]> {
    const allTemplates = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.userId, userId))
      .orderBy(desc(workoutTemplates.updatedAt));

    const result = await Promise.all(
      allTemplates.map(async (template) => {
        const templateSegs = await db
          .select()
          .from(templateSegments)
          .where(eq(templateSegments.templateId, template.id))
          .orderBy(templateSegments.order);

        return { template, segments: templateSegs };
      })
    );

    return result;
  }

  async getTemplateByName(name: string, userId: string): Promise<{ template: WorkoutTemplate; segments: TemplateSegment[] } | undefined> {
    const [template] = await db
      .select()
      .from(workoutTemplates)
      .where(and(eq(workoutTemplates.userId, userId), eq(workoutTemplates.name, name)));

    if (!template) return undefined;

    const templateSegs = await db
      .select()
      .from(templateSegments)
      .where(eq(templateSegments.templateId, template.id))
      .orderBy(templateSegments.order);

    return { template, segments: templateSegs };
  }

  async deleteTemplate(id: string, userId: string): Promise<void> {
    // Cascade delete will automatically remove template segments
    await db.delete(workoutTemplates).where(and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, userId)));
  }
}

export const storage = new DbStorage();
