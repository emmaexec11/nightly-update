import { type Habit } from "@shared/schema";
import { useToggleCheck, useUpdateHabit } from "@/hooks/use-execution";
import { motion } from "framer-motion";
import { Check, Flame, AlertTriangle, TrendingUp, TrendingDown, Trash2, StickyNote, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { HighlightedText } from "@/components/HighlightedText";
import { getAvailableColors, wrapTextWithHighlight } from "@/lib/highlight-parser";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const NOTE_COLORS = [
  { name: "Yellow", bg: "#fef3c7", text: "#92400e" },
  { name: "Green", bg: "#d1fae5", text: "#065f46" },
  { name: "Blue", bg: "#dbeafe", text: "#1e40af" },
  { name: "Purple", bg: "#ede9fe", text: "#5b21b6" },
  { name: "Pink", bg: "#fce7f3", text: "#9d174d" },
  { name: "Orange", bg: "#ffedd5", text: "#c2410c" },
  { name: "Red", bg: "#fee2e2", text: "#b91c1c" },
  { name: "Cyan", bg: "#cffafe", text: "#0e7490" },
  { name: "Gray", bg: "#f3f4f6", text: "#374151" },
];

interface HabitRowProps {
  habit: Habit;
  date: string;
  showDelete?: boolean;
  onDelete?: () => void;
  onClick?: () => void;
  todayCompleted?: boolean;
  streak?: number;
  successRate?: number;
  missedLastRequired?: boolean;
}

export function HabitRow({ 
  habit, 
  date, 
  showDelete = false,
  onDelete,
  onClick,
  todayCompleted = false,
  streak = 0,
  successRate = 0,
  missedLastRequired = false,
}: HabitRowProps) {
  const toggleCheck = useToggleCheck();
  const updateHabit = useUpdateHabit();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState(habit.notes || "");
  const [selectedBgColor, setSelectedBgColor] = useState(habit.noteColor || NOTE_COLORS[0].bg);
  const [selectedTextColor, setSelectedTextColor] = useState(habit.noteTextColor || NOTE_COLORS[0].text);
  const [highlightPopoverOpen, setHighlightPopoverOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setNoteText(habit.notes || "");
      setSelectedBgColor(habit.noteColor || NOTE_COLORS[0].bg);
      setSelectedTextColor(habit.noteTextColor || NOTE_COLORS[0].text);
    }
    setNoteDialogOpen(open);
  };
  
  const handleToggle = () => {
    toggleCheck.mutate({
      date,
      habitId: habit.id,
      completed: !todayCompleted
    });
  };

  const handleSaveNote = () => {
    updateHabit.mutate({
      id: habit.id,
      data: {
        notes: noteText || null,
        noteColor: noteText ? selectedBgColor : null,
        noteTextColor: noteText ? selectedTextColor : null,
      }
    });
    setNoteDialogOpen(false);
  };

  const handleRemoveNote = () => {
    setNoteText("");
    updateHabit.mutate({
      id: habit.id,
      data: {
        notes: null,
        noteColor: null,
        noteTextColor: null,
      }
    });
    setNoteDialogOpen(false);
  };

  const handleHighlightClick = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        setSelectionRange({ start, end });
        setHighlightPopoverOpen(true);
      }
    }
  };

  const applyHighlight = (colorName: string) => {
    if (selectionRange && selectionRange.start !== selectionRange.end) {
      const newText = wrapTextWithHighlight(noteText, selectionRange.start, selectionRange.end, colorName);
      setNoteText(newText);
      setSelectionRange(null);
      setHighlightPopoverOpen(false);
    }
  };

  const isSuccess = successRate >= 80;
  const isDanger = successRate < 50;
  const highlightColors = getAvailableColors();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col gap-2 p-4 rounded-xl bg-card border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        {/* Clickable Area for Details */}
        <div 
          className="flex-1 flex items-center gap-4 cursor-pointer" 
          onClick={onClick}
          data-testid={`habit-row-${habit.id}`}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">
                {habit.name}
              </h3>
              {missedLastRequired && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
                  </TooltipTrigger>
                  <TooltipContent>Missed last required day!</TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Flame className={cn("h-3 w-3", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                {streak} streak
              </span>
              <span className={cn(
                "flex items-center gap-1",
                isSuccess ? "text-emerald-500" : isDanger ? "text-red-500" : "text-yellow-500"
              )}>
                {isSuccess ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {successRate}% rate
              </span>
            </div>
          </div>
        </div>

        {/* Action Area - Note, Toggle & Delete */}
        <div className="flex items-center gap-2 pl-4 border-l border-white/5 ml-4">
          {/* Add/Edit Note Button */}
          <Dialog open={noteDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  habit.notes && "text-amber-500"
                )}
                data-testid={`button-habit-note-${habit.id}`}
              >
                <StickyNote className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Habit Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Select text and click highlight to color it
                    </p>
                    <Popover open={highlightPopoverOpen} onOpenChange={setHighlightPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleHighlightClick}
                          data-testid="button-highlight-text"
                        >
                          <Highlighter className="h-4 w-4 mr-1" />
                          Highlight
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="end">
                        <p className="text-xs text-muted-foreground mb-2">Pick highlight color:</p>
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {highlightColors.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => applyHighlight(color.name)}
                              className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: color.bg }}
                              title={color.name}
                              data-testid={`button-highlight-color-${color.name}`}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Add a visible note for this habit... Use [color]text[/color] to highlight"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="min-h-[100px] resize-none font-mono text-sm"
                    data-testid="input-habit-note"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Note Background Color</p>
                  <div className="flex flex-wrap gap-2">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          setSelectedBgColor(color.bg);
                          setSelectedTextColor(color.text);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-md border-2 transition-all",
                          selectedBgColor === color.bg ? "border-primary scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color.bg }}
                        title={color.name}
                        data-testid={`button-note-color-${color.name.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview</p>
                  <div 
                    className="p-3 rounded-md text-sm"
                    style={{ 
                      backgroundColor: selectedBgColor, 
                      color: selectedTextColor 
                    }}
                  >
                    <HighlightedText text={noteText || "Your note will appear here..."} />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {habit.notes && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveNote}
                      className="text-destructive"
                      data-testid="button-remove-note"
                    >
                      Remove Note
                    </Button>
                  )}
                  <DialogClose asChild>
                    <Button variant="outline" data-testid="button-cancel-note">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleSaveNote}
                    disabled={updateHabit.isPending}
                    data-testid="button-save-note"
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <button
            onClick={(e) => {
              e.preventDefault();
              handleToggle();
            }}
            disabled={toggleCheck.isPending}
            className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center transition-all duration-200",
              todayCompleted 
                ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-white"
            )}
            data-testid={`button-toggle-habit-${habit.id}`}
          >
            <Check className="h-6 w-6" />
          </button>
          {showDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="text-destructive"
              data-testid={`button-delete-habit-${habit.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Visible Note Badge */}
      {habit.notes && (
        <div 
          className="px-3 py-2 rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
          style={{ 
            backgroundColor: habit.noteColor || NOTE_COLORS[0].bg, 
            color: habit.noteTextColor || NOTE_COLORS[0].text 
          }}
          onClick={() => handleDialogOpenChange(true)}
          data-testid={`note-badge-${habit.id}`}
        >
          <HighlightedText text={habit.notes} />
        </div>
      )}
    </motion.div>
  );
}
