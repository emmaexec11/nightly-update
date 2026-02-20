import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { format } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Dashboard
  app.get(api.dashboard.get.path, async (req, res) => {
    const date = (req.query.date as string) || format(new Date(), 'yyyy-MM-dd');
    const data = await storage.getDashboardData(date);
    res.json(data);
  });

  // Goals
  app.get(api.goals.list.path, async (req, res) => {
    const goals = await storage.getGoals();
    res.json(goals);
  });

  app.post(api.goals.create.path, async (req, res) => {
    try {
      const input = api.goals.create.input.parse(req.body);
      const goal = await storage.createGoal(input);
      res.status(201).json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.goals.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      await storage.deleteGoal(id);
      res.status(204).send();
    } catch (err) {
      return res.status(404).json({ message: "Goal not found" });
    }
  });

  app.put(api.goals.update.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const updates = api.goals.update.input.parse(req.body);
      const goal = await storage.updateGoal(id, updates);
      res.json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(404).json({ message: "Goal not found" });
    }
  });

  app.post(api.goals.reorder.path, async (req, res) => {
    try {
      const { orderedIds } = api.goals.reorder.input.parse(req.body);
      await storage.reorderGoals(orderedIds);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Habits
  app.get(api.habits.list.path, async (req, res) => {
    const habits = await storage.getHabits();
    res.json(habits);
  });

  app.post(api.habits.create.path, async (req, res) => {
    try {
      const input = api.habits.create.input.parse(req.body);
      const habit = await storage.createHabit(input);
      res.status(201).json(habit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.habits.get.path, async (req, res) => {
    const habit = await storage.getHabit(Number(req.params.id));
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    res.json(habit);
  });

  app.delete(api.habits.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      await storage.deleteHabit(id);
      res.status(204).send();
    } catch (err) {
      return res.status(404).json({ message: "Habit not found" });
    }
  });

  app.put(api.habits.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const parseResult = api.habits.update.input.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: "Invalid data", field: parseResult.error.message });
    }
    try {
      const updated = await storage.updateHabit(id, parseResult.data);
      res.json(updated);
    } catch (err) {
      return res.status(404).json({ message: "Habit not found" });
    }
  });

  app.get(api.habits.history.path, async (req, res) => {
    const id = Number(req.params.id);
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const startDate = format(twoMonthsAgo, 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');
    
    try {
      const checks = await storage.getHabitCheckHistory(id, startDate, endDate);
      res.json(checks);
    } catch (err) {
      return res.status(404).json({ message: "Habit not found" });
    }
  });

  app.post(api.habits.reorder.path, async (req, res) => {
    try {
      const { orderedIds } = api.habits.reorder.input.parse(req.body);
      await storage.reorderHabits(orderedIds);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Checks
  app.post(api.checks.toggle.path, async (req, res) => {
    try {
      const { date, habitId, completed } = api.checks.toggle.input.parse(req.body);
      const check = await storage.toggleHabitCheck(date, habitId, completed);
      res.json(check);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Goal Reviews
  app.post(api.goalReviews.create.path, async (req, res) => {
    try {
      const input = api.goalReviews.create.input.parse(req.body);
      const review = await storage.createGoalReview(input);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.goalReviews.list.path, async (req, res) => {
    const reviews = await storage.getGoalReviews();
    res.json(reviews);
  });

  // Mindset Notes
  app.get(api.mindsetNotes.list.path, async (req, res) => {
    const notes = await storage.getMindsetNotes();
    res.json(notes);
  });

  app.post(api.mindsetNotes.create.path, async (req, res) => {
    try {
      const input = api.mindsetNotes.create.input.parse(req.body);
      const note = await storage.createMindsetNote(input);
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.mindsetNotes.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      await storage.deleteMindsetNote(id);
      res.status(204).send();
    } catch (err) {
      return res.status(404).json({ message: "Note not found" });
    }
  });

  // Lag Indicators
  app.get(api.lagIndicators.listByGoal.path, async (req, res) => {
    const goalId = Number(req.params.goalId);
    const indicators = await storage.getLagIndicatorsByGoal(goalId);
    res.json(indicators);
  });

  app.post(api.lagIndicators.create.path, async (req, res) => {
    try {
      const input = api.lagIndicators.create.input.parse(req.body);
      const indicator = await storage.createLagIndicator(input);
      res.status(201).json(indicator);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.lagIndicators.update.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const input = api.lagIndicators.update.input.parse(req.body);
      const updated = await storage.updateLagIndicator(id, input);
      if (!updated) {
        return res.status(404).json({ message: "Lag indicator not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.lagIndicators.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      await storage.deleteLagIndicator(id);
      res.status(204).send();
    } catch (err) {
      return res.status(404).json({ message: "Lag indicator not found" });
    }
  });

  app.post(api.lagIndicators.addEntry.path, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const { date, value } = api.lagIndicators.addEntry.input.parse(req.body);
      const entry = await storage.addLagIndicatorEntry(id, date, value);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.lagIndicators.getEntries.path, async (req, res) => {
    const id = Number(req.params.id);
    const entries = await storage.getLagIndicatorEntries(id);
    res.json(entries);
  });

  // Seed Data
  await seedData();

  return httpServer;
}

async function seedData() {
  const existingGoals = await storage.getGoals();
  if (existingGoals.length === 0) {
    console.log("Seeding data...");
    
    // Yearly Goal
    const year = await storage.createGoal({
      name: "Health & Fitness — 180 lbs @ ~12% Body Fat",
      type: "Yearly",
      targetSuccess: 80
    });

    // Quarterly Goals
    const q1 = await storage.createGoal({
      name: "Q1: Regulation & Base",
      type: "Quarterly",
      parentGoalId: year.id,
      targetSuccess: 80
    });

    const q2 = await storage.createGoal({
      name: "Q2: Accumulation",
      type: "Quarterly",
      parentGoalId: year.id,
      targetSuccess: 80
    });

    // Monthly Goal
    const month = await storage.createGoal({
      name: "Maintain consistency, progressive overload, and recovery",
      type: "Monthly",
      parentGoalId: q1.id,
      targetSuccess: 80
    });

    // Weekly Goal
    const week = await storage.createGoal({
      name: "Execute training and nutrition habits with ≥80% consistency",
      type: "Weekly",
      parentGoalId: month.id,
      targetSuccess: 80
    });

    // Habits linked to Weekly goal
    await storage.createHabit({
      name: "Protein target hit",
      linkedGoalId: week.id,
      requiredDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      frequencyType: "Daily"
    });

    await storage.createHabit({
      name: "Evening wind-down",
      linkedGoalId: week.id,
      requiredDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      frequencyType: "Daily"
    });

    await storage.createHabit({
      name: "Training / movement",
      linkedGoalId: week.id,
      requiredDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      frequencyType: "Daily"
    });
    
    console.log("Seeding complete.");
  }
}
