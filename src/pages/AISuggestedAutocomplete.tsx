import React from "react";
import { Sparkles, X } from "lucide-react";

interface AISuggestedAutocompleteProps {
  suggestions?: string[];
  onClose?: () => void;
}

export default function AISuggestedAutocomplete({ 
  suggestions = [], 
  onClose 
}: AISuggestedAutocompleteProps) {
  if (!suggestions.length) return null;

  return (
    <div className="bg-white border border-light rounded-md shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Sparkles className="w-4 h-4 text-accent" />
          AI Suggestions
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1"
            title="Close AI Suggestions"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {suggestions.map((text, index) => (
          <li
            key={index}
            className="px-3 py-1 rounded hover:bg-accent-light cursor-pointer text-sm"
            onClick={() => {
              navigator.clipboard.writeText(text);
              // Optional: show a brief "copied" feedback
            }}
            title="Click to copy to clipboard"
          >
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
