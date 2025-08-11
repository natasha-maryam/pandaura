import React, { useState } from "react";
import { Lightbulb, X, Code } from "lucide-react";

interface RefactorSuggestion {
  type: string;
  message: string;
  originalCode: string;
  refactoredCode: string;
  line: number;
}

interface Props {
  suggestion: RefactorSuggestion | null;
  onApply: (refactoredCode: string) => void;
  onDismiss: () => void;
}

export default function RefactorSuggestionBanner({ suggestion, onApply, onDismiss }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  if (!suggestion) return null;

  return (
    <div className="bg-accent-light border border-accent rounded-md p-3 mb-2 relative">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-muted hover:text-primary"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Lightbulb className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <div className="font-medium text-primary text-sm">
            {suggestion.message}
          </div>
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs bg-white border border-light px-3 py-1 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <Code className="w-3 h-3" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            
            <button
              onClick={() => onApply(suggestion.refactoredCode)}
              className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-secondary transition-colors"
            >
              Apply Refactor
            </button>
            
            <button
              onClick={onDismiss}
              className="text-xs text-muted hover:text-primary px-2 py-1"
            >
              Dismiss
            </button>
          </div>

          {showPreview && (
            <div className="mt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-medium text-muted mb-1">Before:</div>
                  <pre className="bg-gray-100 p-2 rounded border text-xs overflow-x-auto">
                    {suggestion.originalCode}
                  </pre>
                </div>
                <div>
                  <div className="font-medium text-muted mb-1">After:</div>
                  <pre className="bg-green-50 p-2 rounded border text-xs overflow-x-auto">
                    {suggestion.refactoredCode}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}