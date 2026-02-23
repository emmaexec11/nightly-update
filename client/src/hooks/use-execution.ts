import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertGoal, type InsertHabit, type DashboardData, type InsertDailyCheckin, type InsertMindsetNote, type MindsetNote, type InsertLagIndicator, type LagIndicator, type LagIndicatorEntry } from "@shared/schema";

// === DASHBOARD ===
export function useDashboard(date?: string) {
  return useQuery({
    queryKey: [api.dashboard.get.path, date],
    queryFn: async () => {
      const url = buildUrl(api.dashboard.get.path);
      const queryParams = date ? `?date=${date}` : '';
      const res = await fetch(url + queryParams, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      // Cast to DashboardData as defined in schema/routes types
      return api.dashboard.get.responses[200].parse(await res.json()) as DashboardData;
    },
  });
}

// === GOALS ===
export function useGoals() {
  return useQuery({
    queryKey: [api.goals.list.path],
    queryFn: async () => {
      const res = await fetch(api.goals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch goals");
      return api.goals.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertGoal) => {
      const res = await fetch(api.goals.create.path, {
        method: api.goals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return api.goals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.goals.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

// === HABITS ===
export function useHabits() {
  return useQuery({
    queryKey: [api.habits.list.path],
    queryFn: async () => {
      const res = await fetch(api.habits.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch habits");
      return api.habits.list.responses[200].parse(await res.json());
    },
  });
}

export function useHabit(id: number) {
  return useQuery({
    queryKey: [api.habits.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.habits.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch habit details");
      return api.habits.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertHabit) => {
      const res = await fetch(api.habits.create.path, {
        method: api.habits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create habit");
      return api.habits.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.habits.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

// === CHECKS & EXECUTION ===
export function useToggleCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { date: string; habitId: number; completed: boolean }) => {
      const res = await fetch(api.checks.toggle.path, {
        method: api.checks.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle check");
      return api.checks.toggle.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate dashboard to update progress bars
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
      // Invalidate specific habit detail view
      queryClient.invalidateQueries({ queryKey: [api.habits.get.path, variables.habitId] });
      // Invalidate habit history for calendar view
      queryClient.invalidateQueries({ queryKey: [api.habits.history.path, variables.habitId] });
    },
  });
}

export function useUpdateCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDailyCheckin) => {
      const res = await fetch(api.checkins.update.path, {
        method: api.checkins.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update checkin");
      return api.checkins.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.goals.delete.path, { id });
      const res = await fetch(url, {
        method: api.goals.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete goal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.goals.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.habits.delete.path, { id });
      const res = await fetch(url, {
        method: api.habits.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete habit");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.habits.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHabit> }) => {
      const url = buildUrl(api.habits.update.path, { id });
      const res = await fetch(url, {
        method: api.habits.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update habit");
      return api.habits.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.habits.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.habits.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useHabitHistory(habitId: number) {
  return useQuery({
    queryKey: [api.habits.history.path, habitId],
    queryFn: async () => {
      const url = buildUrl(api.habits.history.path, { id: habitId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch habit history");
      return api.habits.history.responses[200].parse(await res.json());
    },
    enabled: habitId > 0,
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertGoal> }) => {
      const url = buildUrl(api.goals.update.path, { id });
      const res = await fetch(url, {
        method: api.goals.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return api.goals.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.goals.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useReorderGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await fetch(api.goals.reorder.path, {
        method: api.goals.reorder.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reorder goals");
      return api.goals.reorder.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.goals.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useReorderHabits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await fetch(api.habits.reorder.path, {
        method: api.habits.reorder.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reorder habits");
      return api.habits.reorder.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.habits.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useCreateGoalReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { goalId: number; goalName: string; goalType: string; achieved: boolean; reflectionNotes: string; completedAt: string }) => {
      const res = await fetch(api.goalReviews.create.path, {
        method: api.goalReviews.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create goal review");
      return api.goalReviews.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.goalReviews.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

// === MINDSET NOTES ===
export function useMindsetNotes() {
  return useQuery<MindsetNote[]>({
    queryKey: [api.mindsetNotes.list.path],
    queryFn: async () => {
      const res = await fetch(api.mindsetNotes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mindset notes");
      return api.mindsetNotes.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMindsetNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMindsetNote) => {
      const res = await fetch(api.mindsetNotes.create.path, {
        method: api.mindsetNotes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create mindset note");
      return api.mindsetNotes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mindsetNotes.list.path] });
    },
  });
}

export function useDeleteMindsetNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.mindsetNotes.delete.path, { id });
      const res = await fetch(url, {
        method: api.mindsetNotes.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete mindset note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mindsetNotes.list.path] });
    },
  });
}

// === LAG INDICATORS ===
export function useLagIndicators(goalId: number) {
  return useQuery<LagIndicator[]>({
    queryKey: [api.lagIndicators.listByGoal.path, goalId],
    queryFn: async () => {
      const url = buildUrl(api.lagIndicators.listByGoal.path, { goalId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch lag indicators");
      return api.lagIndicators.listByGoal.responses[200].parse(await res.json());
    },
    enabled: goalId > 0,
  });
}

export function useCreateLagIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLagIndicator) => {
      const res = await fetch(api.lagIndicators.create.path, {
        method: api.lagIndicators.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create lag indicator");
      return api.lagIndicators.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.lagIndicators.listByGoal.path, variables.goalId] });
    },
  });
}

export function useUpdateLagIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, goalId, data }: { id: number; goalId: number; data: Partial<InsertLagIndicator> }) => {
      const url = buildUrl(api.lagIndicators.update.path, { id });
      const res = await fetch(url, {
        method: api.lagIndicators.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update lag indicator");
      return { indicator: api.lagIndicators.update.responses[200].parse(await res.json()), goalId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.lagIndicators.listByGoal.path, result.goalId] });
    },
  });
}

export function useDeleteLagIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, goalId }: { id: number; goalId: number }) => {
      const url = buildUrl(api.lagIndicators.delete.path, { id });
      const res = await fetch(url, {
        method: api.lagIndicators.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete lag indicator");
      return goalId;
    },
    onSuccess: (goalId) => {
      queryClient.invalidateQueries({ queryKey: [api.lagIndicators.listByGoal.path, goalId] });
    },
  });
}

export function useLagIndicatorEntries(lagIndicatorId: number) {
  return useQuery<LagIndicatorEntry[]>({
    queryKey: [api.lagIndicators.getEntries.path, lagIndicatorId],
    queryFn: async () => {
      const url = buildUrl(api.lagIndicators.getEntries.path, { id: lagIndicatorId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch lag indicator entries");
      return api.lagIndicators.getEntries.responses[200].parse(await res.json());
    },
    enabled: lagIndicatorId > 0,
  });
}

export function useAddLagIndicatorEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lagIndicatorId, date, value }: { lagIndicatorId: number; date: string; value: string }) => {
      const url = buildUrl(api.lagIndicators.addEntry.path, { id: lagIndicatorId });
      const res = await fetch(url, {
        method: api.lagIndicators.addEntry.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, value }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add lag indicator entry");
      return api.lagIndicators.addEntry.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.lagIndicators.getEntries.path, variables.lagIndicatorId] });
    },
  });
}
