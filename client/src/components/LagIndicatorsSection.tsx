import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TrendingDown, ExternalLink, Plus, Check, ChevronRight, Pencil, Link, Trash2 } from "lucide-react";
import { useLagIndicators, useAddLagIndicatorEntry, useLagIndicatorEntries, useCreateLagIndicator, useUpdateLagIndicator, useDeleteLagIndicator } from "@/hooks/use-execution";
import { useToast } from "@/hooks/use-toast";
import { LagIndicatorGraphDialog } from "./LagIndicatorGraphDialog";

interface LagIndicatorsSectionProps {
  goalId: number;
}

function QuickIndicatorRow({ indicator, goalId, onEdit }: { indicator: any; goalId: number; onEdit: () => void }) {
  const [value, setValue] = useState("");
  const [showGraph, setShowGraph] = useState(false);
  const { data: entries = [] } = useLagIndicatorEntries(indicator.id);
  const addEntry = useAddLagIndicatorEntry();
  const deleteIndicator = useDeleteLagIndicator();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const todayEntry = entries.find((e: any) => e.date === today);
  const latestEntry = entries[0];

  const handleSave = () => {
    if (!value.trim()) return;
    addEntry.mutate(
      { lagIndicatorId: indicator.id, date: today, value: value.trim() },
      {
        onSuccess: () => {
          setValue("");
          toast({ title: "Saved", description: `${indicator.name} updated.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not save.", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Delete this indicator?")) {
      deleteIndicator.mutate({ id: indicator.id, goalId });
    }
  };

  if (indicator.type === 'external_link') {
    return (
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-3 py-2 px-3 rounded-md bg-card/30 border border-white/5 flex-1 hover-elevate cursor-pointer"
          onClick={() => indicator.notionUrl && window.open(indicator.notionUrl, '_blank')}
          data-testid={`indicator-link-${indicator.id}`}
        >
          <ExternalLink className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm flex-1">{indicator.name}</span>
          <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
            Notion
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onEdit}
          data-testid={`button-edit-link-${indicator.id}`}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive/60"
          onClick={handleDelete}
          disabled={deleteIndicator.isPending}
          data-testid={`button-delete-indicator-${indicator.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-3 py-2 px-3 rounded-md bg-card/30 border border-white/5 flex-1 hover-elevate cursor-pointer"
          onClick={() => setShowGraph(true)}
          data-testid={`indicator-row-${indicator.id}`}
        >
          <TrendingDown className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm font-medium">{indicator.name}</span>
          {latestEntry && (
            <span className="text-xs text-muted-foreground ml-auto">
              {todayEntry ? (
                <span className="text-emerald-400">{todayEntry.value}{indicator.unit ? ` ${indicator.unit}` : ''}</span>
              ) : (
                <span>{latestEntry.value}{indicator.unit ? ` ${indicator.unit}` : ''}</span>
              )}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="text"
            placeholder={todayEntry ? "Update..." : "Today..."}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-20 h-8 bg-secondary/50 border-white/5 text-sm text-center"
            data-testid={`input-quick-${indicator.id}`}
          />
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={!value.trim() || addEntry.isPending}
            data-testid={`button-quick-save-${indicator.id}`}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive/60"
            onClick={handleDelete}
            disabled={deleteIndicator.isPending}
            data-testid={`button-delete-indicator-${indicator.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <LagIndicatorGraphDialog 
        indicator={indicator} 
        open={showGraph} 
        onOpenChange={setShowGraph} 
      />
    </>
  );
}

export function LagIndicatorsSection({ goalId }: LagIndicatorsSectionProps) {
  const { data: indicators = [] } = useLagIndicators(goalId);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<any>(null);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  
  const createIndicator = useCreateLagIndicator();
  const updateIndicator = useUpdateLagIndicator();
  const { toast } = useToast();

  const openAddDialog = () => {
    setEditingIndicator(null);
    setLinkName("");
    setLinkUrl("");
    setShowLinkDialog(true);
  };

  const openEditDialog = (indicator: any) => {
    setEditingIndicator(indicator);
    setLinkName(indicator.name || "");
    setLinkUrl(indicator.notionUrl || "");
    setShowLinkDialog(true);
  };

  const handleSaveLink = () => {
    if (!linkName.trim() || !linkUrl.trim()) return;
    
    if (editingIndicator) {
      updateIndicator.mutate(
        { id: editingIndicator.id, goalId, data: { name: linkName.trim(), notionUrl: linkUrl.trim() } },
        {
          onSuccess: () => {
            setShowLinkDialog(false);
            toast({ title: "Updated", description: "Link updated successfully." });
          },
          onError: () => {
            toast({ title: "Error", description: "Could not update link.", variant: "destructive" });
          }
        }
      );
    } else {
      createIndicator.mutate(
        { goalId, name: linkName.trim(), type: 'external_link', notionUrl: linkUrl.trim() },
        {
          onSuccess: () => {
            setShowLinkDialog(false);
            toast({ title: "Added", description: "Link added successfully." });
          },
          onError: () => {
            toast({ title: "Error", description: "Could not add link.", variant: "destructive" });
          }
        }
      );
    }
  };

  return (
    <>
      <div className="space-y-2 px-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest flex items-center gap-2">
            <TrendingDown className="h-3 w-3" />
            Lag Indicators
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground"
            onClick={openAddDialog}
            data-testid="button-add-link"
          >
            <Link className="h-3 w-3" />
            Add Link
          </Button>
        </div>
        {indicators.length > 0 ? (
          <div className="space-y-2">
            {indicators.map((indicator: any) => (
              <QuickIndicatorRow 
                key={indicator.id} 
                indicator={indicator} 
                goalId={goalId}
                onEdit={() => openEditDialog(indicator)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">
            No lag indicators yet. Click "Add Link" to add a Notion link.
          </p>
        )}
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIndicator ? "Edit Link" : "Add Link"}</DialogTitle>
            <DialogDescription>
              Add a link to your external tracking (like Notion tables).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="e.g., Weight Tracker"
                data-testid="input-link-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://notion.so/..."
                data-testid="input-link-url"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowLinkDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveLink}
                disabled={!linkName.trim() || !linkUrl.trim() || createIndicator.isPending || updateIndicator.isPending}
                data-testid="button-save-link"
              >
                {createIndicator.isPending || updateIndicator.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
