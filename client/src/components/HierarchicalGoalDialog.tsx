import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type InsertGoal } from "@shared/schema";
import { useCreateGoal, useGoals } from "@/hooks/use-execution";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GOAL_TYPES = ["Yearly", "Quarterly", "Monthly", "Weekly"];

export function HierarchicalGoalDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState<string | null>(null);
  const [presetParentId, setPresetParentId] = useState<number | null>(null);
  const { toast } = useToast();
  const createGoal = useCreateGoal();
  const { data: goals } = useGoals();
  
  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema.partial()),
    defaultValues: {
      name: "",
      type: "Yearly",
      targetSuccess: 80,
      description: "",
      notes: "",
    }
  });

  // Listen for custom event to open dialog with preset values
  useEffect(() => {
    const handleOpenGoalDialog = (e: CustomEvent<{ parentId: number; type: string }>) => {
      setPresetType(e.detail.type);
      setPresetParentId(e.detail.parentId);
      form.setValue("type", e.detail.type);
      form.setValue("parentGoalId", e.detail.parentId);
      setOpen(true);
    };
    
    document.addEventListener('open-goal-dialog', handleOpenGoalDialog as EventListener);
    return () => {
      document.removeEventListener('open-goal-dialog', handleOpenGoalDialog as EventListener);
    };
  }, [form]);

  const selectedType = form.watch("type");
  
  // Get available parent goals based on selected type
  const getAvailableParents = () => {
    if (selectedType === "Yearly") return [];
    const typeOrder = { Quarterly: "Yearly", Monthly: "Quarterly", Weekly: "Monthly" };
    const parentType = typeOrder[selectedType as keyof typeof typeOrder];
    return goals?.filter(g => g.type === parentType) || [];
  };

  const handleClose = () => {
    setOpen(false);
    setPresetType(null);
    setPresetParentId(null);
    form.reset();
  };

  const onSubmit = (data: InsertGoal) => {
    if (!data.name?.trim()) {
      toast({ title: "Error", description: "Goal name is required.", variant: "destructive" });
      return;
    }

    createGoal.mutate(data, {
      onSuccess: () => {
        handleClose();
        toast({ title: "Goal Created", description: `${data.type} goal added.` });
        onSuccess?.();
      },
      onError: (err) => {
        console.error(err);
        toast({ title: "Error", description: "Could not create goal.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed border-white/20 hover:border-white/40">
          <Target className="h-4 w-4" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select 
                onValueChange={(val) => {
                  form.setValue("type", val);
                  form.setValue("parentGoalId", undefined);
                }}
                defaultValue={form.getValues("type")}
              >
                <SelectTrigger className="bg-secondary/50 border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType !== "Yearly" && (
              <div className="space-y-2">
                <Label>Parent Goal</Label>
                <Select 
                  onValueChange={(val) => form.setValue("parentGoalId", parseInt(val))}
                >
                  <SelectTrigger className="bg-secondary/50 border-white/5">
                    <SelectValue placeholder="Select parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableParents().map(goal => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Goal Name *</Label>
            <Input 
              {...form.register("name")} 
              placeholder="e.g., Build $1M ARR Business" 
              className="bg-secondary/50 border-white/5 text-lg"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea 
              {...form.register("description")} 
              className="bg-secondary/50 border-white/5 min-h-[80px]"
              placeholder="Details..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea 
              {...form.register("notes")} 
              className="bg-secondary/50 border-white/5 min-h-[60px]"
              placeholder="Additional notes..."
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
