import { db } from "./db";
import {
  goals, habits, dailyCheckins, habitChecks, weeklyReviews, goalReviews, mindsetNotes, lagIndicators, lagIndicatorEntries,
  type InsertGoal, type InsertHabit, type InsertDailyCheckin, type InsertWeeklyReview, type InsertGoalReview, type InsertMindsetNote, type InsertLagIndicator, type InsertLagIndicatorEntry,
  type Goal, type Habit, type DailyCheckin, type HabitCheck, type GoalReview, type MindsetNote, type LagIndicator, type LagIndicatorEntry,
  type HabitWithStats, type DashboardData, type GoalWithHabits
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { startOfWeek, endOfWeek, format, subDays, isSameDay, parseISO, getDay } from "date-fns";

export interface IStorage {
  getGoals(): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  updateGoal(id: number, updates: Partial<InsertGoal>): Promise<Goal>;
  
  getHabits(): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  getHabit(id: number): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<void>;
  updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit>;
  getHabitCheckHistory(habitId: number, startDate: string, endDate: string): Promise<HabitCheck[]>;
  
  getDashboardData(dateStr: string): Promise<DashboardData>;
  toggleHabitCheck(dateStr: string, habitId: number, completed: boolean): Promise<HabitCheck>;
  
  updateCheckin(checkin: InsertDailyCheckin): Promise<DailyCheckin>;
  
  createGoalReview(review: InsertGoalReview): Promise<GoalReview>;
  getGoalReviews(): Promise<GoalReview[]>;
  
  getMindsetNotes(): Promise<MindsetNote[]>;
  createMindsetNote(note: InsertMindsetNote): Promise<MindsetNote>;
  deleteMindsetNote(id: number): Promise<void>;
  
  getLagIndicatorsByGoal(goalId: number): Promise<LagIndicator[]>;
  createLagIndicator(indicator: InsertLagIndicator): Promise<LagIndicator>;
  updateLagIndicator(id: number, data: Partial<InsertLagIndicator>): Promise<LagIndicator | null>;
  deleteLagIndicator(id: number): Promise<void>;
  addLagIndicatorEntry(lagIndicatorId: number, date: string, value: string): Promise<LagIndicatorEntry>;
  getLagIndicatorEntries(lagIndicatorId: number): Promise<LagIndicatorEntry[]>;
  
  reorderGoals(orderedIds: number[]): Promise<void>;
  reorderHabits(orderedIds: number[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getGoals(): Promise<Goal[]> {
    return await db.select().from(goals).orderBy(goals.position, goals.type);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async deleteGoal(id: number): Promise<void> {
    // Delete subgoals first
    const subgoals = await db.select().from(goals).where(eq(goals.parentGoalId, id));
    for (const sg of subgoals) {
      await this.deleteGoal(sg.id);
    }
    // Delete habits linked to this goal
    await db.delete(habits).where(eq(habits.linkedGoalId, id));
    // Delete goal
    await db.delete(goals).where(eq(goals.id, id));
  }

  async updateGoal(id: number, updates: Partial<InsertGoal>): Promise<Goal> {
    const [updated] = await db.update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return updated;
  }

  async getHabits(): Promise<Habit[]> {
    return await db.select().from(habits).orderBy(habits.position);
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    return newHabit;
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    return await db.query.habits.findFirst({
      where: eq(habits.id, id),
      with: {
        checks: true
      }
    });
  }

  async deleteHabit(id: number): Promise<void> {
    await db.delete(habitChecks).where(eq(habitChecks.habitId, id));
    await db.delete(habits).where(eq(habits.id, id));
  }

  async updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit> {
    const [updated] = await db.update(habits)
      .set(updates)
      .where(eq(habits.id, id))
      .returning();
    return updated;
  }

  async getHabitCheckHistory(habitId: number, startDate: string, endDate: string): Promise<HabitCheck[]> {
    return await db.select().from(habitChecks)
      .where(
        and(
          eq(habitChecks.habitId, habitId),
          gte(habitChecks.date, startDate),
          lte(habitChecks.date, endDate)
        )
      );
  }

  async toggleHabitCheck(dateStr: string, habitId: number, completed: boolean): Promise<HabitCheck> {
    const existing = await db.select().from(habitChecks).where(
      and(eq(habitChecks.date, dateStr), eq(habitChecks.habitId, habitId))
    ).limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(habitChecks)
        .set({ completed })
        .where(eq(habitChecks.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(habitChecks)
        .values({ date: dateStr, habitId, completed })
        .returning();
      return created;
    }
  }

  async updateCheckin(checkin: InsertDailyCheckin): Promise<DailyCheckin> {
    const [updated] = await db.insert(dailyCheckins)
      .values(checkin)
      .onConflictDoUpdate({
        target: dailyCheckins.date,
        set: { notes: checkin.notes }
      })
      .returning();
    return updated;
  }

  private calculateHabitStats(habit: Habit, allChecks: HabitCheck[], dateStr: string) {
    const targetDate = parseISO(dateStr);
    const dayName = format(targetDate, 'EEE');
    
    // Get today's check
    const todayCheck = allChecks.find(c => c.habitId === habit.id && c.date === dateStr);
    const todayCompleted = todayCheck?.completed || false;

    // Calculate streak (consecutive required days completed, including today if completed)
    let streak = 0;
    let checkDate = targetDate;
    
    // Start from today if it's a required day
    while (true) {
      const checkDayName = format(checkDate, 'EEE');
      
      // Skip non-required days
      if (!habit.requiredDays.includes(checkDayName)) {
        checkDate = subDays(checkDate, 1);
        // Safety limit
        if (checkDate.getTime() < subDays(targetDate, 365).getTime()) break;
        continue;
      }
      
      const dateCheck = allChecks.find(
        c => c.habitId === habit.id && c.date === format(checkDate, 'yyyy-MM-dd') && c.completed
      );
      
      if (dateCheck?.completed) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Calculate success rate based only on days with data (actual tracking period)
    const habitChecksForThis = allChecks.filter(c => c.habitId === habit.id);
    let requiredCount = 0;
    let completedCount = 0;
    
    // Only count days where we have check-in data for this habit
    if (habitChecksForThis.length > 0) {
      // Find the earliest check-in date for this habit
      const dates = habitChecksForThis.map(c => c.date).sort();
      const firstDate = parseISO(dates[0]);
      
      // Count from first tracked day to today
      let countDate = firstDate;
      while (countDate <= targetDate) {
        const countDayName = format(countDate, 'EEE');
        if (habit.requiredDays.includes(countDayName)) {
          requiredCount++;
          const check = habitChecksForThis.find(
            c => c.date === format(countDate, 'yyyy-MM-dd') && c.completed
          );
          if (check?.completed) completedCount++;
        }
        countDate = new Date(countDate.getTime() + 24 * 60 * 60 * 1000);
      }
    } else if (todayCompleted) {
      // First day ever, and they completed it
      requiredCount = 1;
      completedCount = 1;
    }
    
    const successRate = requiredCount > 0 ? Math.round((completedCount / requiredCount) * 100) : 0;

    // Check if missed last required day (only if today is not the first day)
    let missedLastRequired = false;
    if (habitChecksForThis.length > 0) {
      let checkDate2 = subDays(targetDate, 1);
      
      while (true) {
        const checkDayName = format(checkDate2, 'EEE');
        if (habit.requiredDays.includes(checkDayName)) {
          const lastRequiredCheck = allChecks.find(
            c => c.habitId === habit.id && c.date === format(checkDate2, 'yyyy-MM-dd')
          );
          missedLastRequired = !lastRequiredCheck?.completed;
          break;
        }
        checkDate2 = subDays(checkDate2, 1);
        if (checkDate2.getTime() < subDays(targetDate, 30).getTime()) break;
      }
    }

    return { streak, successRate, todayCompleted, missedLastRequired };
  }

  async getDashboardData(dateStr: string): Promise<DashboardData> {
    const targetDate = parseISO(dateStr);
    const dayName = format(targetDate, 'EEE');

    // Get all goals and habits
    const allGoals = await this.getGoals();
    const allHabits = await this.getHabits();
    const allChecks = await db.select().from(habitChecks);

    // Helper to recursively build subgoals with habits
    const buildGoalTree = (goalId: number): any[] => {
      return allGoals
        .filter(g => g.parentGoalId === goalId)
        .map(g => ({
          ...g,
          subgoals: buildGoalTree(g.id),
          habits: allHabits.filter(h => h.linkedGoalId === g.id).map(habit => ({
            ...habit,
            ...this.calculateHabitStats(habit, allChecks, dateStr)
          })),
        }));
    };

    // Build goal tree with habits and stats
    const goalsWithHabits: any[] = allGoals
      .filter(g => !g.parentGoalId) // Only top-level goals
      .map(goal => ({
        ...goal,
        subgoals: buildGoalTree(goal.id),
        habits: allHabits.filter(h => h.linkedGoalId === goal.id).map(habit => ({
          ...habit,
          ...this.calculateHabitStats(habit, allChecks, dateStr)
        })),
      }));

    // Get daily checkin
    const [dailyCheckin] = await db.select().from(dailyCheckins).where(eq(dailyCheckins.date, dateStr));

    return {
      goals: goalsWithHabits,
      dailyCheckin: dailyCheckin || null,
    };
  }

  async createGoalReview(review: InsertGoalReview): Promise<GoalReview> {
    const [newReview] = await db.insert(goalReviews).values(review).returning();
    return newReview;
  }

  async getGoalReviews(): Promise<GoalReview[]> {
    return await db.select().from(goalReviews).orderBy(desc(goalReviews.completedAt));
  }

  async getMindsetNotes(): Promise<MindsetNote[]> {
    return await db.select().from(mindsetNotes);
  }

  async createMindsetNote(note: InsertMindsetNote): Promise<MindsetNote> {
    const [newNote] = await db.insert(mindsetNotes).values(note).returning();
    return newNote;
  }

  async deleteMindsetNote(id: number): Promise<void> {
    await db.delete(mindsetNotes).where(eq(mindsetNotes.id, id));
  }

  async getLagIndicatorsByGoal(goalId: number): Promise<LagIndicator[]> {
    return await db.select().from(lagIndicators).where(eq(lagIndicators.goalId, goalId));
  }

  async createLagIndicator(indicator: InsertLagIndicator): Promise<LagIndicator> {
    const [newIndicator] = await db.insert(lagIndicators).values(indicator).returning();
    return newIndicator;
  }

  async updateLagIndicator(id: number, data: Partial<InsertLagIndicator>): Promise<LagIndicator | null> {
    const [updated] = await db.update(lagIndicators).set(data).where(eq(lagIndicators.id, id)).returning();
    return updated || null;
  }

  async deleteLagIndicator(id: number): Promise<void> {
    await db.delete(lagIndicatorEntries).where(eq(lagIndicatorEntries.lagIndicatorId, id));
    await db.delete(lagIndicators).where(eq(lagIndicators.id, id));
  }

  async addLagIndicatorEntry(lagIndicatorId: number, date: string, value: string): Promise<LagIndicatorEntry> {
    // Upsert - update if exists for this date, otherwise insert
    const existing = await db.select().from(lagIndicatorEntries).where(
      and(eq(lagIndicatorEntries.lagIndicatorId, lagIndicatorId), eq(lagIndicatorEntries.date, date))
    ).limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(lagIndicatorEntries)
        .set({ value })
        .where(eq(lagIndicatorEntries.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(lagIndicatorEntries)
        .values({ lagIndicatorId, date, value })
        .returning();
      return created;
    }
  }

  async getLagIndicatorEntries(lagIndicatorId: number): Promise<LagIndicatorEntry[]> {
    return await db.select().from(lagIndicatorEntries)
      .where(eq(lagIndicatorEntries.lagIndicatorId, lagIndicatorId))
      .orderBy(desc(lagIndicatorEntries.date));
  }

  async reorderGoals(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(goals)
        .set({ position: i })
        .where(eq(goals.id, orderedIds[i]));
    }
  }

  async reorderHabits(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(habits)
        .set({ position: i })
        .where(eq(habits.id, orderedIds[i]));
    }
  }
}

export const storage = new DatabaseStorage();
