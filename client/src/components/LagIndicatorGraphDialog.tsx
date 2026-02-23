import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { useLagIndicatorEntries } from "@/hooks/use-execution";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";

interface LagIndicatorGraphDialogProps {
  indicator: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LagIndicatorGraphDialog({ indicator, open, onOpenChange }: LagIndicatorGraphDialogProps) {
  const { data: entries = [] } = useLagIndicatorEntries(indicator.id);

  if (indicator.type === 'external_link') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-400" />
              {indicator.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-4">This indicator links to an external resource.</p>
            {indicator.notionUrl && (
              <a
                href={indicator.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline text-lg"
                data-testid="link-external-indicator"
              >
                Open in Notion
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Parse entries for chart - entries come newest-first, reverse for chronological display
  const chartData = [...entries].reverse().map((entry: any) => {
    const parsed = parseFloat(entry.value);
    return {
      date: entry.date,
      value: isNaN(parsed) ? null : parsed,
      label: format(parseISO(entry.date), 'MMM d'),
    };
  }).filter(d => d.value !== null) as Array<{ date: string; value: number; label: string }>;

  // Calculate trend - compare the two most recent valid values
  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null;
  const previousValue = chartData.length > 1 ? chartData[chartData.length - 2].value : null;
  const trend = latestValue !== null && previousValue !== null 
    ? latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'stable'
    : 'stable';

  // Calculate average from valid numeric entries only
  const average = chartData.length > 0 
    ? chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length 
    : 0;

  // Min/max for Y-axis
  const values = chartData.map(d => d.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 100;
  const padding = (maxVal - minVal) * 0.1 || 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-400" />
            {indicator.name}
            {indicator.unit && <Badge variant="outline" className="ml-2">{indicator.unit}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Stats Row */}
          <div className="flex items-center gap-6 justify-center">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Current</div>
              <div className="text-2xl font-mono font-bold">
                {latestValue !== null ? latestValue.toFixed(1) : '—'}
                {indicator.unit && <span className="text-sm text-muted-foreground ml-1">{indicator.unit}</span>}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Average</div>
              <div className="text-lg font-mono">
                {average.toFixed(1)}
                {indicator.unit && <span className="text-sm text-muted-foreground ml-1">{indicator.unit}</span>}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Trend</div>
              <div className="flex items-center justify-center gap-1">
                {trend === 'up' && <TrendingUp className="h-5 w-5 text-red-400" />}
                {trend === 'down' && <TrendingDown className="h-5 w-5 text-emerald-400" />}
                {trend === 'stable' && <Minus className="h-5 w-5 text-muted-foreground" />}
                <span className={trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-muted-foreground'}>
                  {trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'Stable'}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: '#888', fontSize: 11 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={{ stroke: '#333' }}
                  />
                  <YAxis 
                    domain={[minVal - padding, maxVal + padding]}
                    tick={{ fill: '#888', fontSize: 11 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={{ stroke: '#333' }}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value}${indicator.unit ? ' ' + indicator.unit : ''}`, 'Value']}
                  />
                  <ReferenceLine 
                    y={average} 
                    stroke="#666" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Avg', fill: '#666', fontSize: 10 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#34d399' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : chartData.length === 1 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <p>Add more entries to see the trend graph</p>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <p>No data yet. Start tracking to see your progress.</p>
            </div>
          )}

          {/* Recent Entries */}
          {entries.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              <div className="text-xs text-muted-foreground uppercase mb-2">Recent Entries</div>
              {entries.slice(0, 7).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-card/30">
                  <span className="text-muted-foreground font-mono text-xs">
                    {format(parseISO(entry.date), 'EEE, MMM d')}
                  </span>
                  <span className="font-medium">
                    {entry.value}{indicator.unit ? ` ${indicator.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
