import { useState } from "react";
import { format } from "date-fns";
import { useCreateGoalReview } from "@/hooks/use-execution";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@shared/schema";

interface GoalAchievementDialogProps {
  goal: Goal;
  onSuccess?: () => void;
}

export function GoalAchievementDialog({ goal, onSuccess }: GoalAchievementDialogProps) {
  const [open, setOpen] = useState(false);
  const [achieved, setAchieved] = useState<boolean | null>(null);
  const [reflectionNotes, setReflectionNotes] = useState("");
  const { toast } = useToast();
  const createReview = useCreateGoalReview();

  const handleSubmit = async () => {
    if (achieved === null) {
      toast({ title: "Select an option", description: "Did you achieve this goal?", variant: "destructive" });
      return;
    }

    try {
      await createReview.mutateAsync({
        goalId: goal.id,
        goalName: goal.name,
        goalType: goal.type,
        achieved,
        reflectionNotes,
        completedAt: format(new Date(), "yyyy-MM-dd"),
      });

      setOpen(false);
      setAchieved(null);
      setReflectionNotes("");
      toast({ 
        title: achieved ? "Goal Achieved!" : "Goal Reviewed", 
        description: "Your reflection has been saved. Edit the goal to set your next target."
      });
      onSuccess?.();
    } catch (err) {
      toast({ title: "Error", description: "Could not save review.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-emerald-500/60 hover:text-emerald-500"
          data-testid={`button-review-goal-${goal.id}`}
        >
          <Flag className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Complete {goal.type} Goal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="text-xs text-muted-foreground font-mono mb-1">{goal.type}</div>
            <h3 className="font-semibold text-lg">{goal.name}</h3>
          </div>

          <div className="space-y-3">
            <Label>Did you achieve this goal?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAchieved(true)}
                className={`
                  flex items-center justify-center gap-2 p-4 rounded-lg border transition-all
                  ${achieved === true 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-secondary/30 border-white/10 hover:border-white/20'}
                `}
                data-testid="button-achieved-yes"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setAchieved(false)}
                className={`
                  flex items-center justify-center gap-2 p-4 rounded-lg border transition-all
                  ${achieved === false 
                    ? 'bg-red-500/20 border-red-500 text-red-400' 
                    : 'bg-secondary/30 border-white/10 hover:border-white/20'}
                `}
                data-testid="button-achieved-no"
              >
                <XCircle className="h-5 w-5" />
                <span className="font-medium">No</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reflection Notes</Label>
            <Textarea 
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
              className="bg-secondary/50 border-white/5 min-h-[100px]"
              placeholder="What worked? What didn't? What will you do differently?"
              data-testid="input-reflection-notes"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createReview.isPending}
              data-testid="button-submit-review"
            >
              {createReview.isPending ? "Saving..." : "Save Reflection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
