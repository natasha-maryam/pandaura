import React, { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import AutoFixTooltip from "./AutoFixTooltip";
import RefactorSuggestionBanner from "./RefactorSuggestionBanner";
import SmartEditToolbar from "./SmartEditToolbar";

interface Props {
  initialCode: string;
  vendorType: string;
  onChange: (code: string) => void;
}


export default function STEditor({ initialCode, vendorType, onChange }: Props) {
  const [code, setCode] = useState(initialCode);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showRefactorSuggestion, setShowRefactorSuggestion] = useState(false);
  const [showSmartToolbar, setShowSmartToolbar] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectedLine, setSelectedLine] = useState(0);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Only update code when initialCode changes and is provided
    if (initialCode !== code) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleEditorChange = (value: string | undefined) => {
    const updated = value || "";
    setCode(updated);
    onChange(updated);

    // Simulate showing an AI tooltip if a tag is undefined
    if (updated.includes("undefined_tag")) {
      setShowTooltip(true);
      setTooltipPosition({ top: 50, left: 200 }); // fixed position for demo
    } else {
      setShowTooltip(false);
    }
  };

  const handleApplyFix = () => {
    const fixedCode = code.replace("undefined_tag", "defined_tag");
    setCode(fixedCode);
    onChange(fixedCode);
    setShowTooltip(false);
  };

  // Mock refactor suggestion detection
  useEffect(() => {
    if (code.includes("IF") && code.includes("ELSE") && code.includes("IF")) {
      setShowRefactorSuggestion(true);
    } else {
      setShowRefactorSuggestion(false);
    }
  }, [code]);

  const mockRefactorSuggestion = {
    type: "nested-conditionals",
    message: "This nested IF structure can be simplified with a CASE block. Want to refactor?",
    originalCode: "IF condition1 THEN\n  IF condition2 THEN\n    result := 1;\n  ELSE\n    result := 2;\n  END_IF;\nELSE\n  result := 0;\nEND_IF;",
    refactoredCode: "CASE TRUE OF\n  condition1 AND condition2: result := 1;\n  condition1 AND NOT condition2: result := 2;\n  ELSE result := 0;\nEND_CASE;",
    line: 10
  };

  const handleRefactorApply = (refactoredCode: string) => {
    setCode(refactoredCode);
    onChange(refactoredCode);
    setShowRefactorSuggestion(false);
  };

  const handleTextSelection = (selection: any) => {
    if (selection && selection.startLineNumber && selection.endLineNumber) {
      const lineNumber = selection.startLineNumber;
      const lines = code.split('\n');
      const selectedLines = lines.slice(selection.startLineNumber - 1, selection.endLineNumber);
      const selected = selectedLines.join('\n');
      
      if (selected.trim()) {
        setSelectedText(selected);
        setSelectedLine(lineNumber);
        
        // Calculate toolbar position (mock - in real implementation would use Monaco's position API)
        setToolbarPosition({ x: 300, y: lineNumber * 20 + 100 });
        setShowSmartToolbar(true);
      } else {
        setShowSmartToolbar(false);
      }
    }
  };

  return (
    <div className="relative w-full h-[90vh]">
      {/* Refactor Suggestion Banner */}
      {showRefactorSuggestion && (
        <RefactorSuggestionBanner
          suggestion={mockRefactorSuggestion}
          onApply={handleRefactorApply}
          onDismiss={() => setShowRefactorSuggestion(false)}
        />
      )}

      {/* Monaco Editor */}
      <div className="border border-light rounded shadow-sm h-full">
        <MonacoEditor
          height="100%"
          language="pascal"
          theme="vs-light"
          value={code}
          onChange={handleEditorChange}
          onMount={(editor) => {
            // Set up selection listener
            editor.onDidChangeCursorSelection((e: any) => {
              handleTextSelection(e.selection);
            });
          }}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            selectOnLineNumbers: true,
            glyphMargin: true,
            folding: true,
            lineNumbers: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 14,
              horizontalScrollbarSize: 14,
            },
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>

      {/* Auto-Fix Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          <AutoFixTooltip
            message="Looks like this tag is undefined. Do you want to auto-fix it?"
            onApply={handleApplyFix}
          />
        </div>
      )}

      {/* Smart Edit Toolbar */}
      <SmartEditToolbar
        isVisible={showSmartToolbar}
        selectedText={selectedText}
        selectedLine={selectedLine}
        position={toolbarPosition}
        onExplain={(text) => console.log("Explaining:", text)}
        onRefactor={(text) => console.log("Refactoring:", text)}
        onSimplify={(text) => console.log("Simplifying:", text)}
        onTagEdit={(line) => console.log("Editing tags for line:", line)}
      />
    </div>
  );
}
