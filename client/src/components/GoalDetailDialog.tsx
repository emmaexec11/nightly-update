import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, ChevronRight, Repeat, Edit2, Check, X, TrendingDown, Plus, Trash2, ExternalLink } from "lucide-react";
import { useUpdateGoal, useLagIndicators, useCreateLagIndicator, useDeleteLagIndicator, useLagIndicatorEntries, useAddLagIndicatorEntry } from "@/hooks/use-execution";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface GoalDetailDialogProps {
  goal: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorScheme: { bg: string; border: string; text: string };
  onSuccess?: () => void;
}

function LagIndicatorRow({ indicator, goalId }: { indicator: any; goalId: number }) {
  const [todayValue, setTodayValue] = useState("");
  const { data: entries = [] } = useLagIndicatorEntries(indicator.id);
  const addEntry = useAddLagIndicatorEntry();
  const deleteIndicator = useDeleteLagIndicator();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const todayEntry = entries.find((e: any) => e.date === today);
  const latestEntry = entries[0];

  const handleSaveEntry = () => {
    if (!todayValue.trim()) return;
    addEntry.mutate(
      { lagIndicatorId: indicator.id, date: today, value: todayValue },
      {
        onSuccess: () => {
          setTodayValue("");
          toast({ title: "Saved", description: `${indicator.name} updated.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not save entry.", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteIndicator.mutate(
      { id: indicator.id, goalId },
      {
        onSuccess: () => {
          toast({ title: "Deleted", description: `${indicator.name} removed.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
        }
      }
    );
  };

  if (indicator.type === 'external_link') {
    return (
      <Card className="p-3 bg-card/40 border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ExternalLink className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{indicator.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {indicator.notionUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(indicator.notionUrl, '_blank')}
                className="text-blue-400"
                data-testid={`button-open-link-${indicator.id}`}
              >
                Open
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteIndicator.isPending}
              className="h-7 w-7 text-muted-foreground/60"
              data-testid={`button-delete-indicator-${indicator.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 bg-card/40 border-white/5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium">{indicator.name}</span>
          {indicator.unit && (
            <Badge variant="outline" className="text-xs">{indicator.unit}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteIndicator.isPending}
          className="h-7 w-7 text-muted-foreground/60"
          data-testid={`button-delete-indicator-${indicator.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder={todayEntry ? `Today: ${todayEntry.value}` : "Enter today's value..."}
          value={todayValue}
          onChange={(e) => setTodayValue(e.target.value)}
          className="bg-secondary/50 border-white/5 text-sm flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSaveEntry()}
          data-testid={`input-indicator-value-${indicator.id}`}
        />
        <Button
          size="icon"
          onClick={handleSaveEntry}
          disabled={!todayValue.trim() || addEntry.isPending}
          data-testid={`button-save-indicator-${indicator.id}`}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
      {latestEntry && (
        <div className="text-xs text-muted-foreground mt-2">
          Latest: {latestEntry.value}{indicator.unit ? ` ${indicator.unit}` : ''} ({latestEntry.date})
        </div>
      )}
    </Card>
  );
}

export function GoalDetailDialog({ goal, open, onOpenChange, colorScheme, onSuccess }: GoalDetailDialogProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(goal.description || "");
  const [showAddIndicator, setShowAddIndicator] = useState(false);
  const [newIndicatorName, setNewIndicatorName] = useState("");
  const [newIndicatorType, setNewIndicatorType] = useState<"numeric_daily" | "external_link">("numeric_daily");
  const [newIndicatorUnit, setNewIndicatorUnit] = useState("");
  const [newIndicatorUrl, setNewIndicatorUrl] = useState("");
  
  const updateGoal = useUpdateGoal();
  const { data: lagIndicators = [] } = useLagIndicators(goal.id);
  const createLagIndicator = useCreateLagIndicator();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDescription(goal.description || "");
      setIsEditingDescription(false);
      setShowAddIndicator(false);
      setNewIndicatorName("");
      setNewIndicatorType("numeric_daily");
      setNewIndicatorUnit("");
      setNewIndicatorUrl("");
    }
  }, [open, goal.description]);
  
  const handleAddIndicator = () => {
    if (!newIndicatorName.trim()) return;
    createLagIndicator.mutate(
      {
        goalId: goal.id,
        name: newIndicatorName.trim(),
        type: newIndicatorType,
        unit: newIndicatorType === 'numeric_daily' ? newIndicatorUnit.trim() || null : null,
        notionUrl: newIndicatorType === 'external_link' ? newIndicatorUrl.trim() || null : null,
      },
      {
        onSuccess: () => {
          setNewIndicatorName("");
          setNewIndicatorUnit("");
          setNewIndicatorUrl("");
          setShowAddIndicator(false);
          toast({ title: "Added", description: "Lag indicator created." });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add indicator.", variant: "destructive" });
        }
      }
    );
  };

  const saveDescription = () => {
    const previousDescription = goal.description || "";
    updateGoal.mutate(
      { id: goal.id, data: { description } },
      {
        onSuccess: () => {
          setIsEditingDescription(false);
          toast({ title: "Saved", description: "Description updated." });
          onSuccess?.();
        },
        onError: () => {
          setDescription(previousDescription);
          toast({ title: "Error", description: "Could not save.", variant: "destructive" });
        }
      }
    );
  };
  const getAllSubgoals = (g: any): any[] => {
    let all: any[] = [];
    if (g.subgoals) {
      for (const sub of g.subgoals) {
        all.push(sub);
        all = [...all, ...getAllSubgoals(sub)];
      }
    }
    return all;
  };

  const getAllHabits = (g: any): any[] => {
    let habits = g.habits || [];
    if (g.subgoals) {
      for (const sub of g.subgoals) {
        habits = [...habits, ...getAllHabits(sub)];
      }
    }
    return habits;
  };

  const allSubgoals = getAllSubgoals(goal);
  const allHabits = getAllHabits(goal);

  const groupedSubgoals = {
    Quarterly: allSubgoals.filter(g => g.type === "Quarterly"),
    Monthly: allSubgoals.filter(g => g.type === "Monthly"),
    Weekly: allSubgoals.filter(g => g.type === "Weekly"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-white/10 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className={`h-5 w-5 ${colorScheme.text}`} />
            <span className={colorScheme.text}>{goal.type} Goal</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className={`${colorScheme.bg} border-l-4 ${colorScheme.border} p-4 rounded-sm`}>
            <h2 className={`text-xl font-bold ${colorScheme.text}`}>{goal.name}</h2>
            
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Description</span>
                {!isEditingDescription ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingDescription(true)}
                    className="h-6 w-6 text-muted-foreground/60"
                    data-testid="button-edit-description"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={saveDescription}
                      disabled={updateGoal.isPending}
                      className="h-6 w-6 text-emerald-500"
                      data-testid="button-save-description"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDescription(goal.description || "");
                        setIsEditingDescription(false);
                      }}
                      className="h-6 w-6 text-muted-foreground"
                      data-testid="button-cancel-description"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {isEditingDescription ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this goal..."
                  className="bg-secondary/50 border-white/5 text-sm min-h-[60px]"
                  data-testid="input-goal-description"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {description || <span className="italic text-muted-foreground/50">No description added yet. Click the edit icon to add one.</span>}
                </p>
              )}
            </div>

            {goal.notes && (
              <p className="text-sm text-muted-foreground/70 mt-3 italic">{goal.notes}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="outline" className="text-xs">
                Target: {goal.targetSuccess}%
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Lag Indicators
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddIndicator(!showAddIndicator)}
                className="text-muted-foreground"
                data-testid="button-toggle-add-indicator"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {showAddIndicator && (
              <Card className="p-3 bg-card/40 border-white/5 space-y-3">
                <Input
                  placeholder="Indicator name (e.g., Weight, Body Fat %)"
                  value={newIndicatorName}
                  onChange={(e) => setNewIndicatorName(e.target.value)}
                  className="bg-secondary/50 border-white/5"
                  data-testid="input-indicator-name"
                />
                <Select value={newIndicatorType} onValueChange={(v: "numeric_daily" | "external_link") => setNewIndicatorType(v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/5" data-testid="select-indicator-type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric_daily">Daily Numeric (track values)</SelectItem>
                    <SelectItem value="external_link">External Link (Notion, etc.)</SelectItem>
                  </SelectContent>
                </Select>
                {newIndicatorType === 'numeric_daily' && (
                  <Input
                    placeholder="Unit (optional, e.g., lbs, kg, %)"
                    value={newIndicatorUnit}
                    onChange={(e) => setNewIndicatorUnit(e.target.value)}
                    className="bg-secondary/50 border-white/5"
                    data-testid="input-indicator-unit"
                  />
                )}
                {newIndicatorType === 'external_link' && (
                  <Input
                    placeholder="Notion URL or external link"
                    value={newIndicatorUrl}
                    onChange={(e) => setNewIndicatorUrl(e.target.value)}
                    className="bg-secondary/50 border-white/5"
                    data-testid="input-indicator-url"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddIndicator}
                    disabled={!newIndicatorName.trim() || createLagIndicator.isPending}
                    data-testid="button-create-indicator"
                  >
                    Create
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddIndicator(false)}
                    data-testid="button-cancel-indicator"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {lagIndicators.length > 0 ? (
              <div className="space-y-2">
                {lagIndicators.map((indicator: any) => (
                  <LagIndicatorRow key={indicator.id} indicator={indicator} goalId={goal.id} />
                ))}
              </div>
            ) : !showAddIndicator && (
              <p className="text-sm text-muted-foreground/60 italic pl-6">
                No lag indicators yet. Add one to track measurable outcomes.
              </p>
            )}
          </div>

          {Object.entries(groupedSubgoals).map(([type, goals]) => (
            goals.length > 0 && (
              <div key={type} className="space-y-3">
                <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  {type} Goals ({goals.length})
                </h3>
                <div className="space-y-2 pl-4">
                  {goals.map((g: any) => (
                    <Card key={g.id} className="p-3 bg-card/40 border-white/5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{g.name}</h4>
                          {g.description && (
                            <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {g.targetSuccess}%
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ))}

          {allHabits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Linked Habits ({allHabits.length})
              </h3>
              <div className="space-y-2 pl-4">
                {allHabits.map((h: any) => (
                  <Card key={h.id} className="p-3 bg-card/40 border-white/5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{h.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {h.requiredDays?.map((day: string) => (
                            <Badge key={day} variant="outline" className="text-xs px-1 py-0">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-mono text-emerald-500">{h.successRate || 0}%</div>
                        <div className="text-xs text-muted-foreground">{h.streak || 0} streak</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {allSubgoals.length === 0 && allHabits.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No subgoals or habits linked to this goal yet.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-goal-detail">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
