import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type Goal, type InsertGoal } from "@shared/schema";
import { useUpdateGoal } from "@/hooks/use-execution";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const colorPresets = [
  { name: "Blue", value: "blue", bg: "bg-blue-500" },
  { name: "Purple", value: "purple", bg: "bg-purple-500" },
  { name: "Green", value: "green", bg: "bg-green-500" },
  { name: "Emerald", value: "emerald", bg: "bg-emerald-500" },
  { name: "Amber", value: "amber", bg: "bg-amber-500" },
  { name: "Orange", value: "orange", bg: "bg-orange-500" },
  { name: "Red", value: "red", bg: "bg-red-500" },
  { name: "Pink", value: "pink", bg: "bg-pink-500" },
  { name: "Cyan", value: "cyan", bg: "bg-cyan-500" },
  { name: "Indigo", value: "indigo", bg: "bg-indigo-500" },
];

interface EditGoalDialogProps {
  goal: Goal;
  onSuccess?: () => void;
}

export function EditGoalDialog({ goal, onSuccess }: EditGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const updateGoal = useUpdateGoal();
  
  const [selectedColor, setSelectedColor] = useState(goal.color || "");
  
  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema.partial()),
    defaultValues: {
      name: goal.name,
      description: goal.description || "",
      notes: goal.notes || "",
      targetSuccess: goal.targetSuccess || 80,
      color: goal.color || "",
    }
  });

  const onSubmit = (data: InsertGoal) => {
    updateGoal.mutate(
      { id: goal.id, data: { ...data, color: selectedColor || null } },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          toast({ title: "Goal Updated", description: "Changes saved." });
          onSuccess?.();
        },
        onError: () => {
          toast({ title: "Error", description: "Could not update goal.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Edit {goal.type} Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Goal Name</Label>
            <Input 
              {...form.register("name")} 
              placeholder="Goal name..." 
              className="bg-secondary/50 border-white/5"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              {...form.register("description")} 
              className="bg-secondary/50 border-white/5 min-h-[60px]"
              placeholder="Details..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              {...form.register("notes")} 
              className="bg-secondary/50 border-white/5 min-h-[60px]"
              placeholder="Notes..."
            />
          </div>

          <div className="space-y-2">
            <Label>Target Success %</Label>
            <Input 
              type="number" 
              {...form.register("targetSuccess", { valueAsNumber: true })} 
              className="bg-secondary/50 border-white/5 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Card Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-md ${color.bg} flex items-center justify-center transition-all ${
                    selectedColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "hover:scale-110"
                  }`}
                  title={color.name}
                  data-testid={`color-${color.value}`}
                >
                  {selectedColor === color.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedColor("")}
                className={`w-8 h-8 rounded-md bg-secondary border border-white/20 flex items-center justify-center text-xs text-muted-foreground transition-all ${
                  selectedColor === "" ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "hover:scale-110"
                }`}
                title="Default"
                data-testid="color-default"
              >
                {selectedColor === "" && <Check className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateGoal.isPending}>
              {updateGoal.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
