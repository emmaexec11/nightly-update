import { useRoute } from "wouter";
import { useHabit, useToggleCheck } from "@/hooks/use-execution";
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Trophy, Flame } from "lucide-react";
import { Link } from "wouter";
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function HabitDetail() {
  const [, params] = useRoute("/habits/:id");
  const habitId = parseInt(params?.id || "0");
  const { data: habit, isLoading } = useHabit(habitId);
  const toggleCheck = useToggleCheck();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>This habit does not exist or has been deleted.</AlertDescription>
          <Link href="/" className="mt-4 inline-block text-sm underline">Return Home</Link>
        </Alert>
      </div>
    );
  }

  // Calculate stats manually since detail endpoint might return basic object
  // Assuming habit.checks is an array of { date: string, completed: boolean }
  const totalChecks = habit.checks?.filter(c => c.completed).length || 0;
  
  // Render Calendar Grid
  const renderMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="space-y-4">
        <h3 className="font-mono text-sm font-bold text-muted-foreground uppercase">{format(date, "MMMM yyyy")}</h3>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground/50 py-1 font-mono">{d}</div>
          ))}
          
          {/* Pad start of month if needed - simplified here, assumes starts on Monday for grid or aligns days */}
          {/* Note: date-fns starts week on Sunday by default usually, styling grid-col-start is better */}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const check = habit.checks?.find(c => c.date === dateStr);
            const isCompleted = check?.completed;
            const isRequired = habit.requiredDays?.includes(format(day, "eee")); // 'Mon', 'Tue' etc.
            
            // Check if day is in future
            const isFuture = day > new Date();

            let statusColor = "bg-card border-white/5"; // Default empty
            
            if (!isFuture) {
              if (isCompleted) statusColor = "bg-emerald-500/20 border-emerald-500/50 text-emerald-500";
              else if (isRequired) statusColor = "bg-red-500/10 border-red-500/30 text-red-500"; // Missed
              else statusColor = "bg-secondary/30 border-white/5 text-muted-foreground/20"; // Not required
            }

            return (
              <button
                key={dateStr}
                disabled={isFuture || toggleCheck.isPending}
                onClick={() => {
                  if (!isFuture) {
                    toggleCheck.mutate({ date: dateStr, habitId: habit.id, completed: !isCompleted });
                  }
                }}
                className={cn(
                  "aspect-square rounded-md border flex items-center justify-center text-xs font-mono transition-all hover:scale-105",
                  statusColor,
                  isToday(day) && "ring-1 ring-white"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <header>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">{habit.name}</h1>
              {habit.notes && <p className="text-muted-foreground max-w-xl">{habit.notes}</p>}
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs font-mono text-muted-foreground">FREQUENCY</div>
              <div className="font-medium text-white">{habit.requiredDays?.join(", ")}</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" /> Total Reps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-mono font-bold">{totalChecks}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-white/5">
             <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" /> Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-mono font-bold">
                {/* Streak calculation would ideally come from backend, placeholder */}
                {/* If api.habits.get returns full HabitWithStats, we use it. If not, calc locally or - */}
                { (habit as any).streak ?? "-" }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
             <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-blue-500" /> Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{habit.frequencyType}</div>
              <div className="text-xs text-muted-foreground mt-1">
                 {habit.requiredDays?.length === 7 ? "Every Day" : `${habit.requiredDays?.length} days / week`}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
          {renderMonth(new Date())}
          {renderMonth(subMonths(new Date(), 1))}
        </section>

      </div>
    </div>
  );
}
