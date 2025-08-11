import React, { useState, useEffect } from "react";
import { Lightbulb, RefreshCw, Wand2, Tag, Eye, EyeOff } from "lucide-react";

interface ToolbarAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
}

interface Props {
  isVisible: boolean;
  selectedText: string;
  selectedLine: number;
  position: { x: number; y: number };
  onExplain: (text: string) => void;
  onRefactor: (text: string) => void;
  onSimplify: (text: string) => void;
  onTagEdit: (line: number) => void;
}

export default function SmartEditToolbar({
  isVisible,
  selectedText,
  selectedLine,
  position,
  onExplain,
  onRefactor,
  onSimplify,
  onTagEdit
}: Props) {
  const [explanationVisible, setExplanationVisible] = useState(false);
  const [explanation, setExplanation] = useState("");

  const actions: ToolbarAction[] = [
    {
      id: 'explain',
      icon: <Lightbulb className="w-4 h-4" />,
      label: 'Explain',
      onClick: () => {
        const mockExplanation = generateExplanation(selectedText);
        setExplanation(mockExplanation);
        setExplanationVisible(true);
        onExplain(selectedText);
      },
      variant: 'accent'
    },
    {
      id: 'refactor',
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'Refactor',
      onClick: () => onRefactor(selectedText),
      variant: 'primary'
    },
    {
      id: 'simplify',
      icon: <Wand2 className="w-4 h-4" />,
      label: 'Simplify',
      onClick: () => onSimplify(selectedText),
      variant: 'secondary'
    },
    {
      id: 'tags',
      icon: <Tag className="w-4 h-4" />,
      label: 'Tag Edit',
      onClick: () => onTagEdit(selectedLine),
      variant: 'secondary'
    }
  ];

  // Generate mock explanation based on selected text
  const generateExplanation = (text: string): string => {
    if (text.includes('IF') && text.includes('THEN')) {
      return "This is a conditional logic block that checks if certain conditions are met before executing actions. The IF statement evaluates boolean conditions and executes the THEN clause when true.";
    }
    if (text.includes('CASE')) {
      return "This CASE statement provides multi-way branching logic, evaluating an expression and executing different code blocks based on matching values. It's more efficient than multiple IF-ELSE statements.";
    }
    if (text.includes(':=')) {
      return "This is an assignment operation that sets a variable to a specific value. The ':=' operator is used in structured text to assign values to variables.";
    }
    if (text.includes('AND') || text.includes('OR')) {
      return "This contains boolean logic operators that combine multiple conditions. AND requires all conditions to be true, while OR requires at least one condition to be true.";
    }
    return "This code block contains PLC logic that controls industrial automation processes. The structured text follows IEC 61131-3 standards for programmable controller programming.";
  };

  const getButtonStyles = (variant: string = 'secondary') => {
    const baseStyles = "p-2 rounded shadow-sm text-xs font-medium transition-all duration-150 flex items-center gap-1 whitespace-nowrap";
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-primary text-white hover:bg-secondary`;
      case 'accent':
        return `${baseStyles} bg-accent text-white hover:bg-purple-600`;
      default:
        return `${baseStyles} bg-white border border-light text-primary hover:bg-accent-light`;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Toolbar */}
      <div
        className="fixed z-50 bg-white border border-light rounded-lg shadow-lg p-1 flex gap-1"
        style={{
          left: position.x,
          top: position.y - 50, // Position above the selection
          transform: 'translateX(-50%)'
        }}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={getButtonStyles(action.variant)}
            title={action.label}
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Collapsible Explanation */}
      {explanationVisible && (
        <div
          className="fixed z-40 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-3 max-w-md"
          style={{
            left: position.x,
            top: position.y + 20,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-800 text-xs mb-1">Code Explanation:</div>
                <div className="text-blue-700 text-xs leading-relaxed">{explanation}</div>
              </div>
            </div>
            
            <button
              onClick={() => setExplanationVisible(false)}
              className="text-blue-400 hover:text-blue-600 flex-shrink-0"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}