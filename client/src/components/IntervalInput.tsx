import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface IntervalInputProps {
  id: string;
  name: string;
  onNameChange: (name: string) => void;
  onRemove: () => void;
}

export default function IntervalInput({
  id,
  name,
  onNameChange,
  onRemove,
}: IntervalInputProps) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <Input
        data-testid={`input-interval-${id}`}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="e.g., Run, Bike, Row"
        className="flex-1"
      />
      <Button
        data-testid={`button-remove-${id}`}
        size="icon"
        variant="ghost"
        onClick={onRemove}
      >
        <X className="w-5 h-5" />
      </Button>
    </Card>
  );
}
