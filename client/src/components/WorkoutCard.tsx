import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkoutSegment {
  name: string;
  duration: number;
}

interface WorkoutCardProps {
  id: string;
  name?: string;
  date: Date;
  totalTime: number;
  segments: WorkoutSegment[];
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function WorkoutCard({ id, name, date, totalTime, segments, onDelete, onEdit }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }
  };

  return (
    <>
      <Card 
        className="p-4 hover-elevate active-elevate-2"
        data-testid={`card-workout-${id}`}
      >
        <div 
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {name && (
                <h3 className="text-lg font-bold mb-1" data-testid={`text-workout-name-${id}`}>
                  {name}
                </h3>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-semibold tabular-nums font-mono" data-testid={`text-total-time-${id}`}>
                  {formatTime(totalTime)}
                </span>
                <Badge variant="secondary" data-testid={`text-segment-count-${id}`}>
                  {segments.length} segments
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground" data-testid={`text-date-${id}`}>
                {formatDate(date)} at {date.toLocaleTimeString("en-US", { 
                  hour: "numeric", 
                  minute: "2-digit" 
                })}
              </p>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {segments.map((segment, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between"
                  data-testid={`segment-${id}-${index}`}
                >
                  <span className="text-sm">{segment.name}</span>
                  <span className="text-sm font-mono font-semibold tabular-nums">
                    {formatTime(segment.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {expanded && (onEdit || onDelete) && (
          <div className="mt-4 pt-4 border-t border-border flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                data-testid={`button-edit-${id}`}
                className="flex-1"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                data-testid={`button-delete-${id}`}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{name || 'this workout'}" and all its segments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => {
                onDelete?.();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
