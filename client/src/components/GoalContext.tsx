import { type Goal } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Target, Calendar, BarChart3, Clock } from "lucide-react";

interface GoalContextProps {
  goals: {
    yearly: Goal | null;
    quarterly: Goal | null;
    monthly: Goal | null;
    weekly: Goal | null;
  };
}

export function GoalContext({ goals }: GoalContextProps) {
  const hasGoals = Object.values(goals).some(g => g !== null);

  if (!hasGoals) {
    return (
      <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-muted-foreground">
        <p>No active goals defined. Add context to drive your habits.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <ContextCard 
        label="Yearly" 
        goal={goals.yearly} 
        icon={<Target className="h-4 w-4 text-purple-400" />} 
      />
      <ContextCard 
        label="Quarterly" 
        goal={goals.quarterly} 
        icon={<BarChart3 className="h-4 w-4 text-blue-400" />} 
      />
      <ContextCard 
        label="Monthly" 
        goal={goals.monthly} 
        icon={<Calendar className="h-4 w-4 text-emerald-400" />} 
      />
      <ContextCard 
        label="Weekly" 
        goal={goals.weekly} 
        icon={<Clock className="h-4 w-4 text-orange-400" />} 
      />
    </div>
  );
}

function ContextCard({ label, goal, icon }: { label: string; goal: Goal | null; icon: React.ReactNode }) {
  if (!goal) return (
    <Card className="bg-card/30 border-white/5 p-4 flex flex-col gap-2 opacity-50">
      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="text-sm italic text-muted-foreground">Not set</div>
    </Card>
  );

  return (
    <Card className="bg-card/50 border-white/5 p-4 flex flex-col gap-2 hover:bg-card/80 transition-colors">
      <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="font-medium leading-snug line-clamp-2" title={goal.name}>
        {goal.name}
      </div>
      {goal.targetSuccess && (
        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>Target: {goal.targetSuccess}%</span>
        </div>
      )}
    </Card>
  );
}
