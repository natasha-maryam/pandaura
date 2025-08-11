// src/components/STEditor/AutoFixTooltip.tsx
import React from "react";

interface AutoFixTooltipProps {
  message: string;
  onApply: () => void;
}

export default function AutoFixTooltip({ message, onApply }: AutoFixTooltipProps) {
  return (
    <div className="absolute z-50 bg-white border border-light rounded-md shadow-md p-3 w-64 text-sm">
      <div className="text-primary mb-2">{message}</div>
      <button
        onClick={onApply}
        className="bg-primary text-white px-3 py-1 rounded-md hover:bg-secondary transition-colors text-xs"
      >
        ✅ Apply Fix
      </button>
    </div>
  );
}
