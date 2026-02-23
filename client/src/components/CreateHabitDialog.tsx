import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHabitSchema, type InsertHabit } from "@shared/schema";
import { useCreateHabit, useGoals } from "@/hooks/use-execution";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CreateHabitDialogProps {
  onSuccess?: () => void;
}

export function CreateHabitDialog({ onSuccess }: CreateHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createHabit = useCreateHabit();
  const { data: goals } = useGoals();
  
  const form = useForm<InsertHabit>({
    resolver: zodResolver(insertHabitSchema),
    defaultValues: {
      name: "",
      frequencyType: "Daily",
      requiredDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // Default to every day
      notes: "",
    }
  });

  const handleSubmit = (data: InsertHabit) => {
    createHabit.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "Habit Created", description: "Time to execute." });
        onSuccess?.();
      },
      onError: () => {
        toast({ title: "Error", description: "Could not create habit.", variant: "destructive" });
      }
    });
  };

  const handleDayToggle = (day: string) => {
    const current = form.getValues("requiredDays") || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    form.setValue("requiredDays", updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed border-white/20 hover:border-white/40">
          <Plus className="h-4 w-4" />
          New Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Define New Habit</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Habit Name</Label>
            <Input 
              {...form.register("name")} 
              placeholder="e.g., Read 10 pages" 
              className="bg-secondary/50 border-white/5"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Link to Goal (Optional)</Label>
            <Select 
              onValueChange={(val) => form.setValue("linkedGoalId", val === "none" ? null : parseInt(val))}
            >
              <SelectTrigger className="bg-secondary/50 border-white/5">
                <SelectValue placeholder="Select a goal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific goal</SelectItem>
                {goals?.map(goal => (
                  <SelectItem key={goal.id} value={goal.id.toString()}>
                    {goal.name} ({goal.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Required Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => {
                const isSelected = (form.watch("requiredDays") || []).includes(day);
                return (
                  <div 
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`
                      cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-all
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}
                    `}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            {form.formState.errors.requiredDays && (
              <p className="text-sm text-red-500">{form.formState.errors.requiredDays.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              {...form.register("notes")} 
              className="bg-secondary/50 border-white/5 min-h-[80px]"
              placeholder="Success criteria or details..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createHabit.isPending}>
              {createHabit.isPending ? "Creating..." : "Commit to Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
