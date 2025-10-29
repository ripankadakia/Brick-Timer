import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertSegmentSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

// Reference: blueprint:javascript_log_in_with_replit
export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create a new workout with segments
  app.post("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bodySchema = z.object({
        workout: insertWorkoutSchema,
        segments: z.array(insertSegmentSchema.omit({ workoutId: true })),
      });

      const { workout, segments } = bodySchema.parse(req.body);
      const result = await storage.createWorkout(userId, workout, segments);
      
      res.json(result);
    } catch (error: any) {
      // Zod validation errors should return 400
      if (error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
        return;
      }
      // All other errors are server errors (500)
      res.status(500).json({ message: error.message });
    }
  });

  // Get all workouts for current user
  app.get("/api/workouts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific workout by ID for current user
  app.get("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workout = await storage.getWorkoutById(req.params.id, userId);
      if (!workout) {
        res.status(404).json({ message: "Workout not found" });
        return;
      }
      res.json(workout);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get segments by name for current user (for analytics)
  app.get("/api/segments/:name", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const segments = await storage.getSegmentsByName(req.params.name, userId);
      res.json(segments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a workout for current user
  app.patch("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bodySchema = z.object({
        workout: insertWorkoutSchema.partial(),
        segments: z.array(insertSegmentSchema.omit({ workoutId: true })),
      });

      const { workout, segments } = bodySchema.parse(req.body);
      const result = await storage.updateWorkout(req.params.id, userId, workout, segments);
      
      res.json(result);
    } catch (error: any) {
      // Zod validation errors should return 400
      if (error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
        return;
      }
      // Not found errors should return 404
      if (error.message === 'Workout not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      // All other errors are server errors (500)
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a workout for current user
  app.delete("/api/workouts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteWorkout(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
