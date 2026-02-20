import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'Yearly', 'Quarterly', 'Monthly', 'Weekly'
  parentGoalId: integer("parent_goal_id"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  description: text("description"),
  targetSuccess: integer("target_success").default(80),
  notes: text("notes"),
  color: text("color"), // custom color for goal card (e.g., '#3B82F6', 'blue', 'purple')
  position: integer("position").default(0), // for drag-and-drop ordering
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  linkedGoalId: integer("linked_goal_id"),
  requiredDays: text("required_days").array().notNull(), // ['Mon', 'Tue', ...]
  frequencyType: text("frequency_type").default("Daily"),
  notes: text("notes"),
  noteColor: text("note_color"), // background color for visible note badge
  noteTextColor: text("note_text_color"), // text color for visible note badge
  details: text("details").array(), // sub-steps or detailed breakdown of the habit
  position: integer("position").default(0), // for drag-and-drop ordering
});

export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  notes: text("notes"),
});

export const habitChecks = pgTable("habit_checks", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  habitId: integer("habit_id").notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export const weeklyReviews = pgTable("weekly_reviews", {
  id: serial("id").primaryKey(),
  weekStart: date("week_start").notNull(),
  weekEnd: date("week_end").notNull(),
  weight: text("weight"),
  trainingSessions: integer("training_sessions"),
  nervousSystemScore: integer("nervous_system_score"),
  notes: text("notes"),
});

export const goalReviews = pgTable("goal_reviews", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  goalName: text("goal_name").notNull(),
  goalType: text("goal_type").notNull(),
  achieved: boolean("achieved").notNull(),
  reflectionNotes: text("reflection_notes"),
  completedAt: date("completed_at").notNull(),
});

export const mindsetNotes = pgTable("mindset_notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  category: text("category").default("quote"), // 'quote', 'reminder', 'note'
});

export const lagIndicators = pgTable("lag_indicators", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'numeric_daily' | 'external_link'
  unit: text("unit"), // e.g., 'lbs', 'kg', '%'
  notionUrl: text("notion_url"), // for external_link type
});

export const lagIndicatorEntries = pgTable("lag_indicator_entries", {
  id: serial("id").primaryKey(),
  lagIndicatorId: integer("lag_indicator_id").notNull(),
  date: date("date").notNull(),
  value: text("value").notNull(), // stored as text to handle various numeric formats
});

// === RELATIONS ===

export const goalsRelations = relations(goals, ({ one, many }) => ({
  parentGoal: one(goals, {
    fields: [goals.parentGoalId],
    references: [goals.id],
    relationName: "subgoals"
  }),
  subgoals: many(goals, { relationName: "subgoals" }),
  habits: many(habits),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  goal: one(goals, {
    fields: [habits.linkedGoalId],
    references: [goals.id],
  }),
  checks: many(habitChecks),
}));

export const habitChecksRelations = relations(habitChecks, ({ one }) => ({
  habit: one(habits, {
    fields: [habitChecks.habitId],
    references: [habits.id],
  }),
}));

export const lagIndicatorsRelations = relations(lagIndicators, ({ one, many }) => ({
  goal: one(goals, {
    fields: [lagIndicators.goalId],
    references: [goals.id],
  }),
  entries: many(lagIndicatorEntries),
}));

export const lagIndicatorEntriesRelations = relations(lagIndicatorEntries, ({ one }) => ({
  lagIndicator: one(lagIndicators, {
    fields: [lagIndicatorEntries.lagIndicatorId],
    references: [lagIndicators.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true });
export const insertCheckinSchema = createInsertSchema(dailyCheckins).omit({ id: true });
export const insertHabitCheckSchema = createInsertSchema(habitChecks).omit({ id: true });
export const insertWeeklyReviewSchema = createInsertSchema(weeklyReviews).omit({ id: true });
export const insertGoalReviewSchema = createInsertSchema(goalReviews).omit({ id: true });
export const insertMindsetNoteSchema = createInsertSchema(mindsetNotes).omit({ id: true });
export const insertLagIndicatorSchema = createInsertSchema(lagIndicators).omit({ id: true });
export const insertLagIndicatorEntrySchema = createInsertSchema(lagIndicatorEntries).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = z.infer<typeof insertCheckinSchema>;

export type HabitCheck = typeof habitChecks.$inferSelect;
export type InsertHabitCheck = z.infer<typeof insertHabitCheckSchema>;

export type WeeklyReview = typeof weeklyReviews.$inferSelect;
export type InsertWeeklyReview = z.infer<typeof insertWeeklyReviewSchema>;

export type GoalReview = typeof goalReviews.$inferSelect;
export type InsertGoalReview = z.infer<typeof insertGoalReviewSchema>;

export type MindsetNote = typeof mindsetNotes.$inferSelect;
export type InsertMindsetNote = z.infer<typeof insertMindsetNoteSchema>;

export type LagIndicator = typeof lagIndicators.$inferSelect;
export type InsertLagIndicator = z.infer<typeof insertLagIndicatorSchema>;

export type LagIndicatorEntry = typeof lagIndicatorEntries.$inferSelect;
export type InsertLagIndicatorEntry = z.infer<typeof insertLagIndicatorEntrySchema>;

// Request Types
export type CreateGoalRequest = InsertGoal;
export type CreateHabitRequest = InsertHabit;
export type ToggleHabitCheckRequest = {
  date: string;
  habitId: number;
  completed: boolean;
};

// Response Types
export type HabitWithStats = Habit & {
  streak: number;
  todayCompleted: boolean;
  successRate: number;
  missedLastRequired: boolean;
};

export type GoalWithHabits = Goal & {
  subgoals?: Goal[];
  habits: Habit[];
};

export type DashboardData = {
  goals: GoalWithHabits[];
  dailyCheckin: DailyCheckin | null;
};
