import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertSegmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new workout with segments
  app.post("/api/workouts", async (req, res) => {
    try {
      const bodySchema = z.object({
        workout: insertWorkoutSchema,
        segments: z.array(insertSegmentSchema.omit({ workoutId: true })),
      });

      const { workout, segments } = bodySchema.parse(req.body);
      const result = await storage.createWorkout(workout, segments);
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all workouts
  app.get("/api/workouts", async (_req, res) => {
    try {
      const workouts = await storage.getWorkouts();
      res.json(workouts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific workout by ID
  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const workout = await storage.getWorkoutById(req.params.id);
      if (!workout) {
        res.status(404).json({ message: "Workout not found" });
        return;
      }
      res.json(workout);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get segments by name (for analytics)
  app.get("/api/segments/:name", async (req, res) => {
    try {
      const segments = await storage.getSegmentsByName(req.params.name);
      res.json(segments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
