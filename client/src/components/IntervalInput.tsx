import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface IntervalInputProps {
  id: string;
  name: string;
  onNameChange: (name: string) => void;
  onRemove: () => void;
  onEnter?: () => void;
  suggestions?: string[];
  onRemoveSuggestion?: (name: string) => void;
  dragHandleProps?: any;
  setInputRef?: (element: HTMLInputElement | null) => void;
}

export default function IntervalInput({
  id,
  name,
  onNameChange,
  onRemove,
  onEnter,
  suggestions = [],
  onRemoveSuggestion,
  dragHandleProps,
  setInputRef,
}: IntervalInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleRef = (element: HTMLInputElement | null) => {
    setInputElement(element);
    if (setInputRef) {
      setInputRef(element);
    }
  };

  const filteredSuggestions = name.trim() 
    ? suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(name.toLowerCase()) && 
        suggestion.toLowerCase() !== name.toLowerCase()
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputElement &&
        !inputElement.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputElement]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        onNameChange(filteredSuggestions[selectedIndex]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (onEnter) {
        onEnter();
      }
    } else if (e.key === "Tab") {
      if (showSuggestions && filteredSuggestions.length > 0) {
        e.preventDefault();
        const indexToSelect = selectedIndex >= 0 ? selectedIndex : 0;
        onNameChange(filteredSuggestions[indexToSelect]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (value: string) => {
    onNameChange(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onNameChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative">
      <Card className="p-4 flex items-center gap-3">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
        <Input
          ref={handleRef}
          data-testid={`input-interval-${id}`}
          value={name}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (name.trim()) {
              setShowSuggestions(true);
            }
          }}
          autoComplete="off"
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

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-popover-border rounded-md shadow-lg overflow-hidden"
          data-testid={`suggestions-${id}`}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? "bg-accent text-accent-foreground" 
                  : "hover-elevate"
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              data-testid={`suggestion-${id}-${index}`}
            >
              <span className="flex-1">{suggestion}</span>
              {onRemoveSuggestion && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSuggestion(suggestion);
                  }}
                  data-testid={`remove-suggestion-${id}-${index}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
