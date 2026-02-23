import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type InsertGoal } from "@shared/schema";
import { useCreateGoal } from "@/hooks/use-execution";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreateGoalDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createGoal = useCreateGoal();
  
  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      name: "",
      type: "Yearly",
      targetSuccess: 80,
      notes: "",
    }
  });

  const onSubmit = (data: InsertGoal) => {
    // Ensure targetSuccess is a number
    data.targetSuccess = Number(data.targetSuccess);
    
    createGoal.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "Goal Set", description: "Stay focused." });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not create goal.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed border-white/20 hover:border-white/40">
          <Target className="h-4 w-4" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Set New Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select 
                onValueChange={(val) => form.setValue("type", val)}
                defaultValue={form.getValues("type")}
              >
                <SelectTrigger className="bg-secondary/50 border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Target Success %</Label>
              <Input 
                type="number" 
                {...form.register("targetSuccess", { valueAsNumber: true })} 
                className="bg-secondary/50 border-white/5 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Goal Name</Label>
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
            <Label>Description / Notes</Label>
            <Textarea 
              {...form.register("description")} 
              className="bg-secondary/50 border-white/5 min-h-[80px]"
              placeholder="The big picture..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending ? "Saving..." : "Set Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
