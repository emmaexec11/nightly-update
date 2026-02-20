import { useState } from "react";
import { format } from "date-fns";
import { useDashboard, useDeleteGoal, useDeleteHabit, useMindsetNotes, useCreateMindsetNote, useDeleteMindsetNote, useReorderGoals, useReorderHabits } from "@/hooks/use-execution";
import { HabitRow } from "@/components/HabitRow";
import { HierarchicalGoalDialog } from "@/components/HierarchicalGoalDialog";
import { CreateHabitDialog } from "@/components/CreateHabitDialog";
import { EditGoalDialog } from "@/components/EditGoalDialog";
import { GoalAchievementDialog } from "@/components/GoalAchievementDialog";
import { GoalDetailDialog } from "@/components/GoalDetailDialog";
import { HabitDetailDialog } from "@/components/HabitDetailDialog";
import { LagIndicatorsSection } from "@/components/LagIndicatorsSection";
import { Loader2, Trash2, Plus, Quote, BookOpen, Lightbulb, GripVertical } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const defaultGoalColors = [
  { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
];

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400" },
};

function getGoalColor(goal: any, fallbackIdx: number) {
  if (goal.color && colorMap[goal.color]) {
    return colorMap[goal.color];
  }
  return defaultGoalColors[fallbackIdx % defaultGoalColors.length];
}

// Sortable Goal Section wrapper
function SortableGoalSection({ goal, goalIdx, children }: { goal: any; goalIdx: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-0 top-6 -ml-8 p-2 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground/70"
        data-testid={`drag-handle-goal-${goal.id}`}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      {children}
    </div>
  );
}

// Sortable Habit wrapper
function SortableHabitItem({ habit, children }: { habit: any; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <div 
        {...attributes} 
        {...listeners} 
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground/70"
        data-testid={`drag-handle-habit-${habit.id}`}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function Home() {
  const today = format(new Date(), "yyyy-MM-dd");
  const dayName = format(new Date(), "EEE");
  const { data, isLoading, error, refetch } = useDashboard(today);
  const deleteGoal = useDeleteGoal();
  const deleteHabit = useDeleteHabit();
  const reorderGoals = useReorderGoals();
  const reorderHabits = useReorderHabits();
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  // Mindset notes
  const { data: mindsetNotes } = useMindsetNotes();
  const createNote = useCreateMindsetNote();
  const deleteNote = useDeleteMindsetNote();
  const [newNote, setNewNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newScripture, setNewScripture] = useState("");
  const [showScriptureInput, setShowScriptureInput] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [showFactInput, setShowFactInput] = useState(false);
  
  // Filter notes by category
  const quotes = mindsetNotes?.filter(n => n.category === "quote") || [];
  const scriptures = mindsetNotes?.filter(n => n.category === "scripture") || [];
  const facts = mindsetNotes?.filter(n => n.category === "fact") || [];

  // Detail dialog states
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [selectedGoalColor, setSelectedGoalColor] = useState<any>(null);
  const [selectedHabit, setSelectedHabit] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load execution data. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  // Get all habits required today across all goals
  const getAllHabitsFromGoal = (goal: any): any[] => {
    let habits = goal.habits || [];
    if (goal.subgoals) {
      for (const sub of goal.subgoals) {
        habits = [...habits, ...getAllHabitsFromGoal(sub)];
      }
    }
    return habits;
  };

  const todayHabits = data.goals.flatMap(g => 
    getAllHabitsFromGoal(g).filter((h: any) => h.requiredDays.includes(dayName))
  );

  const handleDeleteGoal = (goalId: number) => {
    if (confirm("Delete this goal and all subgoals?")) {
      deleteGoal.mutate(goalId, { onSuccess: () => refetch() });
    }
  };
  
  // Drag end handler for goals
  const handleGoalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.goals.findIndex(g => g.id === active.id);
      const newIndex = data.goals.findIndex(g => g.id === over.id);
      const newOrder = arrayMove(data.goals, oldIndex, newIndex);
      reorderGoals.mutate(newOrder.map(g => g.id));
    }
  };
  
  // Drag end handler for habits
  const handleHabitDragEnd = (habitIds: number[]) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = habitIds.findIndex(id => id === active.id);
      const newIndex = habitIds.findIndex(id => id === over.id);
      const newOrder = arrayMove(habitIds, oldIndex, newIndex);
      reorderHabits.mutate(newOrder);
    }
  };

  const handleDeleteHabit = (habitId: number) => {
    if (confirm("Delete this habit?")) {
      deleteHabit.mutate(habitId, { onSuccess: () => refetch() });
    }
  };

  // Get the first goal of each type in the hierarchy (recursive search)
  const getFirstGoalOfType = (goal: any, type: string): any | null => {
    if (goal.type === type) return goal;
    if (goal.subgoals && goal.subgoals.length > 0) {
      for (const sub of goal.subgoals) {
        const result = getFirstGoalOfType(sub, type);
        if (result) return result;
      }
    }
    return null;
  };

  // Goal card component for reuse
  const GoalCard = ({ goal, label }: { goal: any; label: string }) => (
    <Card className="bg-card/40 border-white/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-mono mb-2">{label}</div>
          <h4 className="font-semibold text-sm break-words">
            {goal.name || <span className="text-muted-foreground/50 italic">Set your {label.toLowerCase()} goal</span>}
          </h4>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <GoalAchievementDialog goal={goal} onSuccess={() => refetch()} />
          <EditGoalDialog goal={goal} onSuccess={() => refetch()} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteGoal(goal.id)}
            disabled={deleteGoal.isPending}
            className="h-6 w-6 text-destructive/60 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Header */}
        <header className="border-b border-white/5 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-2">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Execution System
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-mono">TODAY</div>
                <div className="text-4xl font-mono font-bold text-emerald-500">
                  {todayHabits.length}
                </div>
                <div className="text-xs text-muted-foreground">habits</div>
              </div>
              <HierarchicalGoalDialog onSuccess={() => refetch()} />
            </div>
          </div>
          
          {/* Inspirational Quote */}
          <div className="mt-6 flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-md">
            <div className="text-3xl opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-amber-500/50">
                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
              </svg>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm md:text-base text-amber-200/80 italic font-medium">
                  "We must all suffer one of two things: the pain of discipline or the pain of regret."
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  — Jim Rohn
                </p>
              </div>
              <div>
                <p className="text-sm md:text-base text-amber-200/80 italic font-medium">
                  "Nothing changes if nothing changes."
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  — Theo Von
                </p>
              </div>
              <div>
                <p className="text-sm md:text-base text-amber-200/80 italic font-medium">
                  "Discipline equals freedom."
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  — Jocko Willink
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Goals */}
        {data.goals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No goals yet. Create your first goal to get started.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGoalDragEnd}>
            <SortableContext items={data.goals.map(g => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-10 pl-8">
            {data.goals.map((yearlyGoal, goalIdx) => {
              const colorScheme = getGoalColor(yearlyGoal, goalIdx);
              const quarterly = getFirstGoalOfType(yearlyGoal, "Quarterly");
              const monthly = quarterly ? getFirstGoalOfType(quarterly, "Monthly") : null;
              const weekly = monthly ? getFirstGoalOfType(monthly, "Weekly") : null;
              
              // Get all habits from this goal tree that are required today
              const goalHabits = getAllHabitsFromGoal(yearlyGoal).filter((h: any) => h.requiredDays.includes(dayName));

              return (
                <SortableGoalSection key={yearlyGoal.id} goal={yearlyGoal} goalIdx={goalIdx}>
                <section className="space-y-5">
                  {/* Yearly Goal */}
                  <div className={`${colorScheme.bg} border-l-4 ${colorScheme.border} pl-4 py-4 rounded-sm flex items-start justify-between`}>
                    <div 
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        setSelectedGoal(yearlyGoal);
                        setSelectedGoalColor(colorScheme);
                      }}
                      data-testid={`goal-yearly-${yearlyGoal.id}`}
                    >
                      <div className="text-xs font-mono text-muted-foreground/70 mb-1 uppercase tracking-widest">
                        Yearly
                      </div>
                      <h2 className={`text-2xl font-bold ${colorScheme.text}`}>
                        {yearlyGoal.name || <span className="text-muted-foreground/50 italic">Set your yearly goal</span>}
                      </h2>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-4">
                      <GoalAchievementDialog goal={yearlyGoal} onSuccess={() => refetch()} />
                      <EditGoalDialog goal={yearlyGoal} onSuccess={() => refetch()} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(yearlyGoal.id)}
                        disabled={deleteGoal.isPending}
                        className="h-8 w-8 text-destructive/60 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Goal Hierarchy - Current Path Only (reversed: Weekly → Monthly → Quarterly) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-2">
                    {weekly ? (
                      <GoalCard goal={weekly} label="Weekly" />
                    ) : monthly ? (
                      <Card className="bg-card/20 border-dashed border-white/10 p-4 hover-elevate cursor-pointer"
                        onClick={() => {
                          document.dispatchEvent(new CustomEvent('open-goal-dialog', { 
                            detail: { parentId: monthly.id, type: 'Weekly' } 
                          }));
                        }}
                        data-testid="card-add-weekly"
                      >
                        <div className="text-xs text-muted-foreground font-mono mb-2">Weekly</div>
                        <p className="text-xs text-muted-foreground/50 italic">+ Add a weekly goal</p>
                      </Card>
                    ) : (
                      <Card className="bg-card/20 border-dashed border-white/10 p-4 opacity-40">
                        <div className="text-xs text-muted-foreground font-mono mb-2">Weekly</div>
                        <p className="text-xs text-muted-foreground/50 italic">Add monthly first</p>
                      </Card>
                    )}
                    {monthly ? (
                      <GoalCard goal={monthly} label="Monthly" />
                    ) : quarterly ? (
                      <Card className="bg-card/20 border-dashed border-white/10 p-4 hover-elevate cursor-pointer"
                        onClick={() => {
                          document.dispatchEvent(new CustomEvent('open-goal-dialog', { 
                            detail: { parentId: quarterly.id, type: 'Monthly' } 
                          }));
                        }}
                        data-testid="card-add-monthly"
                      >
                        <div className="text-xs text-muted-foreground font-mono mb-2">Monthly</div>
                        <p className="text-xs text-muted-foreground/50 italic">+ Add a monthly goal</p>
                      </Card>
                    ) : (
                      <Card className="bg-card/20 border-dashed border-white/10 p-4 opacity-40">
                        <div className="text-xs text-muted-foreground font-mono mb-2">Monthly</div>
                        <p className="text-xs text-muted-foreground/50 italic">Add quarterly first</p>
                      </Card>
                    )}
                    {quarterly ? (
                      <GoalCard goal={quarterly} label="Quarterly" />
                    ) : (
                      <Card className="bg-card/20 border-dashed border-white/10 p-4 hover-elevate cursor-pointer"
                        onClick={() => {
                          document.dispatchEvent(new CustomEvent('open-goal-dialog', { 
                            detail: { parentId: yearlyGoal.id, type: 'Quarterly' } 
                          }));
                        }}
                        data-testid="card-add-quarterly"
                      >
                        <div className="text-xs text-muted-foreground font-mono mb-2">Quarterly</div>
                        <p className="text-xs text-muted-foreground/50 italic">+ Add a quarterly goal</p>
                      </Card>
                    )}
                  </div>

                  {/* Lag Indicators - Quick Entry */}
                  <LagIndicatorsSection goalId={yearlyGoal.id} />

                  {/* Today's Habits */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between px-2">
                      <div className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">
                        Today's Habits
                      </div>
                      <CreateHabitDialog onSuccess={() => refetch()} />
                    </div>
                    
                    {goalHabits.length > 0 ? (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleHabitDragEnd(goalHabits.map((h: any) => h.id))}>
                        <SortableContext items={goalHabits.map((h: any) => h.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {goalHabits.map((habit: any) => (
                              <SortableHabitItem key={habit.id} habit={habit}>
                                <HabitRow
                                  habit={habit}
                                  date={today}
                                  showDelete={true}
                                  onDelete={() => handleDeleteHabit(habit.id)}
                                  onClick={() => setSelectedHabit(habit)}
                                  todayCompleted={habit.todayCompleted}
                                  streak={habit.streak}
                                  successRate={habit.successRate}
                                  missedLastRequired={habit.missedLastRequired}
                                />
                              </SortableHabitItem>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 px-2">No habits required today</p>
                    )}
                  </div>

                  {/* Line Separator */}
                  <div className="border-b border-white/5 pt-4" />
                </section>
                </SortableGoalSection>
              );
            })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Mindset Notes Section */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-amber-500/70" />
              <h2 className="text-lg font-semibold text-muted-foreground">Mindset & Reminders</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="gap-1 text-muted-foreground"
              data-testid="button-add-note"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {showNoteInput && (
            <Card className="p-4 bg-card/40 border-white/5">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a quote or reminder..."
                className="bg-secondary/50 border-white/5 min-h-[80px] mb-3"
                data-testid="textarea-new-note"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setShowNoteInput(false); setNewNote(""); }}
                  data-testid="button-cancel-note"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  disabled={!newNote.trim() || createNote.isPending}
                  onClick={() => {
                    createNote.mutate({ content: newNote.trim(), category: "quote" }, {
                      onSuccess: () => {
                        setNewNote("");
                        setShowNoteInput(false);
                      }
                    });
                  }}
                  data-testid="button-save-note"
                >
                  {createNote.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </Card>
          )}

          {quotes.length > 0 ? (
            <div className="space-y-3">
              {quotes.map((note) => (
                <Card 
                  key={note.id} 
                  className="p-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/10 group"
                  data-testid={`card-note-${note.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-amber-200/80 italic flex-1">
                      "{note.content}"
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this note?")) {
                          deleteNote.mutate(note.id);
                        }
                      }}
                      className="h-6 w-6 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-delete-note-${note.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : !showNoteInput && (
            <p className="text-sm text-muted-foreground/50 italic pl-7">
              Add quotes and reminders to stay focused on your mindset.
            </p>
          )}
        </section>

        {/* Scriptures Section */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500/70" />
              <h2 className="text-lg font-semibold text-muted-foreground">Scriptures</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowScriptureInput(!showScriptureInput)}
              className="gap-1 text-muted-foreground"
              data-testid="button-add-scripture"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {showScriptureInput && (
            <Card className="p-4 bg-card/40 border-white/5">
              <Textarea
                value={newScripture}
                onChange={(e) => setNewScripture(e.target.value)}
                placeholder="Add a scripture or verse..."
                className="bg-secondary/50 border-white/5 min-h-[80px] mb-3"
                data-testid="textarea-new-scripture"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setShowScriptureInput(false); setNewScripture(""); }}
                  data-testid="button-cancel-scripture"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  disabled={!newScripture.trim() || createNote.isPending}
                  onClick={() => {
                    createNote.mutate({ content: newScripture.trim(), category: "scripture" }, {
                      onSuccess: () => {
                        setNewScripture("");
                        setShowScriptureInput(false);
                      }
                    });
                  }}
                  data-testid="button-save-scripture"
                >
                  {createNote.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </Card>
          )}

          {scriptures.length > 0 ? (
            <div className="space-y-3">
              {scriptures.map((note) => (
                <Card 
                  key={note.id} 
                  className="p-4 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/10 group"
                  data-testid={`card-scripture-${note.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-blue-200/80 italic flex-1">
                      "{note.content}"
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this scripture?")) {
                          deleteNote.mutate(note.id);
                        }
                      }}
                      className="h-6 w-6 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-delete-scripture-${note.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : !showScriptureInput && (
            <p className="text-sm text-muted-foreground/50 italic pl-7">
              Add scriptures and verses you want to remember.
            </p>
          )}
        </section>

        {/* Facts & Information Section */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-500/70" />
              <h2 className="text-lg font-semibold text-muted-foreground">Facts & Information</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFactInput(!showFactInput)}
              className="gap-1 text-muted-foreground"
              data-testid="button-add-fact"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {showFactInput && (
            <Card className="p-4 bg-card/40 border-white/5">
              <Textarea
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="Add a fact or information..."
                className="bg-secondary/50 border-white/5 min-h-[80px] mb-3"
                data-testid="textarea-new-fact"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setShowFactInput(false); setNewFact(""); }}
                  data-testid="button-cancel-fact"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  disabled={!newFact.trim() || createNote.isPending}
                  onClick={() => {
                    createNote.mutate({ content: newFact.trim(), category: "fact" }, {
                      onSuccess: () => {
                        setNewFact("");
                        setShowFactInput(false);
                      }
                    });
                  }}
                  data-testid="button-save-fact"
                >
                  {createNote.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </Card>
          )}

          {facts.length > 0 ? (
            <div className="space-y-3">
              {facts.map((note) => (
                <Card 
                  key={note.id} 
                  className="p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/10 group"
                  data-testid={`card-fact-${note.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-green-200/80 flex-1">
                      {note.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this fact?")) {
                          deleteNote.mutate(note.id);
                        }
                      }}
                      className="h-6 w-6 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-delete-fact-${note.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : !showFactInput && (
            <p className="text-sm text-muted-foreground/50 italic pl-7">
              Add facts and information you want to remember.
            </p>
          )}
        </section>

        <div className="h-8" />
      </div>

      {/* Detail Dialogs */}
      {selectedGoal && selectedGoalColor && (
        <GoalDetailDialog
          goal={selectedGoal}
          open={!!selectedGoal}
          onOpenChange={(open) => !open && setSelectedGoal(null)}
          colorScheme={selectedGoalColor}
          onSuccess={() => refetch()}
        />
      )}

      {selectedHabit && (
        <HabitDetailDialog
          habit={selectedHabit}
          open={!!selectedHabit}
          onOpenChange={(open) => !open && setSelectedHabit(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
