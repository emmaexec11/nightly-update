import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Repeat, Plus, Trash2, Check, ListChecks, TrendingUp, Calendar, Pencil, X } from "lucide-react";
import { useUpdateHabit, useHabitHistory, useToggleCheck } from "@/hooks/use-execution";
import { useToast } from "@/hooks/use-toast";
import { format, subWeeks, eachDayOfInterval, startOfWeek, getDay, isFuture } from "date-fns";

interface HabitDetailDialogProps {
  habit: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function HabitDetailDialog({ habit, open, onOpenChange, onSuccess }: HabitDetailDialogProps) {
  const [details, setDetails] = useState<string[]>([]);
  const [newDetail, setNewDetail] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(habit.name || "");
  const [editedRequiredDays, setEditedRequiredDays] = useState<string[]>(habit.requiredDays || []);
  const updateHabit = useUpdateHabit();
  const toggleCheck = useToggleCheck();
  const { toast } = useToast();
  const { data: checkHistory = [] } = useHabitHistory(habit.id);

  useEffect(() => {
    if (open) {
      setDetails([...(habit.details || [])]);
      setEditedName(habit.name || "");
      setEditedRequiredDays(habit.requiredDays || []);
      setIsEditingName(false);
    }
  }, [open, habit.details, habit.name, habit.requiredDays]);

  const handleSaveName = () => {
    if (!editedName.trim() || updateHabit.isPending) return;
    updateHabit.mutate(
      { id: habit.id, data: { name: editedName.trim() } },
      {
        onSuccess: () => {
          setIsEditingName(false);
          toast({ title: "Saved", description: "Habit name updated." });
          onSuccess?.();
        },
        onError: () => {
          toast({ title: "Error", description: "Could not save.", variant: "destructive" });
        }
      }
    );
  };

  const toggleRequiredDay = (day: string) => {
    const newDays = editedRequiredDays.includes(day)
      ? editedRequiredDays.filter(d => d !== day)
      : [...editedRequiredDays, day];
    
    setEditedRequiredDays(newDays);
    
    updateHabit.mutate(
      { id: habit.id, data: { requiredDays: newDays } },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: "Required days updated." });
          onSuccess?.();
        },
        onError: () => {
          setEditedRequiredDays(editedRequiredDays);
          toast({ title: "Error", description: "Could not save.", variant: "destructive" });
        }
      }
    );
  };

  const calendarWeeks = useMemo(() => {
    const today = new Date();
    const dayShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const checksMap = new Map(
      checkHistory.map((c: any) => [c.date, c.completed])
    );
    
    const weeks: Array<Array<{ date: Date; dateStr: string; dayName: string; status: 'completed' | 'missed' | 'not-required' | 'future' }>> = [];
    
    for (let weekNum = 3; weekNum >= 0; weekNum--) {
      const weekStart = startOfWeek(subWeeks(today, weekNum), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const week = weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayName = dayShortNames[getDay(day)];
        const isRequired = editedRequiredDays.includes(dayName);
        const wasCompleted = checksMap.get(dateStr) === true;
        const future = isFuture(day);
        
        let status: 'completed' | 'missed' | 'not-required' | 'future' = 'not-required';
        if (future) {
          status = 'future';
        } else if (wasCompleted) {
          status = 'completed';
        } else if (isRequired) {
          status = 'missed';
        }
        
        return { date: day, dateStr, dayName, status };
      });
      
      weeks.push(week);
    }
    
    return weeks;
  }, [checkHistory, editedRequiredDays]);

  const addDetail = () => {
    if (!newDetail.trim() || updateHabit.isPending) return;
    const updated = [...details, newDetail.trim()];
    const previousDetails = [...details];
    setNewDetail("");
    
    updateHabit.mutate(
      { id: habit.id, data: { details: updated } },
      {
        onSuccess: () => {
          setDetails(updated);
          toast({ title: "Saved", description: "Step added." });
          onSuccess?.();
        },
        onError: () => {
          setDetails(previousDetails);
          toast({ title: "Error", description: "Could not save.", variant: "destructive" });
        }
      }
    );
  };

  const removeDetail = (index: number) => {
    if (updateHabit.isPending) return;
    const updated = details.filter((_, i) => i !== index);
    const previousDetails = [...details];
    
    updateHabit.mutate(
      { id: habit.id, data: { details: updated } },
      {
        onSuccess: () => {
          setDetails(updated);
          toast({ title: "Saved", description: "Step removed." });
          onSuccess?.();
        },
        onError: () => {
          setDetails(previousDetails);
          toast({ title: "Error", description: "Could not remove.", variant: "destructive" });
        }
      }
    );
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-emerald-500" />
            Habit Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="bg-emerald-500/10 border-l-4 border-emerald-500/30 p-4 rounded-sm">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-lg font-bold bg-background/50 border-emerald-500/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditedName(habit.name);
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  data-testid="input-edit-habit-name"
                />
                <Button 
                  size="icon" 
                  onClick={handleSaveName}
                  disabled={!editedName.trim() || updateHabit.isPending}
                  data-testid="button-save-habit-name"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => {
                    setEditedName(habit.name);
                    setIsEditingName(false);
                  }}
                  data-testid="button-cancel-edit-name"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-lg font-bold text-emerald-400">{habit.name}</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingName(true)}
                  data-testid="button-edit-habit-name"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            {habit.notes && (
              <p className="text-sm text-muted-foreground mt-2">{habit.notes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3 bg-card/40 border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground font-mono">SUCCESS RATE</span>
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-500">
                {habit.successRate || 0}%
              </div>
            </Card>
            <Card className="p-3 bg-card/40 border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground font-mono">CURRENT STREAK</span>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-500">
                {habit.streak || 0} days
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Required Days <span className="text-muted-foreground/50">(click to toggle)</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {dayNames.map((day) => (
                <Badge 
                  key={day} 
                  variant={editedRequiredDays.includes(day) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    editedRequiredDays.includes(day) 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                      : "opacity-40"
                  } ${updateHabit.isPending ? "pointer-events-none opacity-50" : ""}`}
                  onClick={() => toggleRequiredDay(day)}
                  data-testid={`badge-day-${day.toLowerCase()}`}
                >
                  {day}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last 4 Weeks
            </h3>
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground/60 font-mono">
                <span className="text-center">M</span>
                <span className="text-center">T</span>
                <span className="text-center">W</span>
                <span className="text-center">T</span>
                <span className="text-center">F</span>
                <span className="text-center">S</span>
                <span className="text-center">S</span>
              </div>
              {calendarWeeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-1">
                  {week.map((day) => {
                    const isClickable = day.status !== 'future';
                    const isCompleted = day.status === 'completed';
                    
                    return (
                      <div
                        key={day.dateStr}
                        title={`${format(day.date, 'MMM d')} - ${day.status === 'completed' ? 'Completed' : day.status === 'missed' ? 'Missed' : day.status === 'future' ? 'Future' : 'Not required'} (click to toggle)`}
                        onClick={() => {
                          if (isClickable) {
                            toggleCheck.mutate(
                              { date: day.dateStr, habitId: habit.id, completed: !isCompleted },
                              {
                                onSuccess: () => {
                                  onSuccess?.();
                                }
                              }
                            );
                          }
                        }}
                        className={`h-6 rounded-sm flex items-center justify-center text-xs font-mono transition-colors ${
                          day.status === 'completed' ? 'bg-emerald-500 text-white' :
                          day.status === 'missed' ? 'bg-red-500 text-white' :
                          day.status === 'future' ? 'bg-muted/20 text-muted-foreground/30' :
                          'bg-purple-500/30 text-purple-300/60'
                        } ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
                        data-testid={`calendar-day-${day.dateStr}`}
                      >
                        {format(day.date, 'd')}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span>Missed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-purple-500/30" />
                <span>Not required</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Detailed Steps / Breakdown
              </h3>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newDetail}
                onChange={(e) => setNewDetail(e.target.value)}
                placeholder="Add a step or detail..."
                className="bg-secondary/50 border-white/5"
                onKeyDown={(e) => e.key === "Enter" && addDetail()}
                data-testid="input-new-detail"
              />
              <Button 
                size="icon" 
                onClick={addDetail}
                disabled={!newDetail.trim() || updateHabit.isPending}
                data-testid="button-add-detail"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {details.length > 0 ? (
              <div className="space-y-2">
                {details.map((detail, idx) => (
                  <Card key={idx} className="p-3 bg-card/40 border-white/5 group">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400 font-mono flex-shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-sm">{detail}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDetail(idx)}
                        className="h-6 w-6 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-delete-detail-${idx}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic py-2">
                Add detailed steps for this habit (e.g., for "Morning Routine": brush teeth, shower, etc.)
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-habit-detail">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
