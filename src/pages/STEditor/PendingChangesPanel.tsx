import React, { useState } from "react";
import { GitCompare, RotateCcw, Check, AlertCircle } from "lucide-react";

interface CodeDiff {
  line: number;
  original: string;
  modified: string;
  type: 'added' | 'removed' | 'changed';
}

interface Props {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  diffs: CodeDiff[];
  originalCode: string;
  modifiedCode: string;
  aiSummary: string;
  onReintegrate: () => void;
  onRevert: () => void;
}

export default function PendingChangesPanel({ 
  isEnabled, 
  onToggle, 
  diffs, 
  originalCode, 
  modifiedCode, 
  aiSummary,
  onReintegrate,
  onRevert 
}: Props) {
  const [showDiffView, setShowDiffView] = useState(false);

  return (
    <div className="border border-light rounded-md bg-white shadow-sm">
      {/* Toggle Header */}
      <div className="p-3 border-b border-light">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="accent-primary"
            />
            <GitCompare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Compare with Original</span>
          </label>
          
          {isEnabled && diffs.length > 0 && (
            <span className="text-xs text-accent bg-accent-light px-2 py-1 rounded">
              {diffs.length} change{diffs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Changes Panel */}
      {isEnabled && (
        <div className="p-3">
          {diffs.length === 0 ? (
            <div className="text-center text-muted text-sm py-4">
              <Check className="w-5 h-5 mx-auto mb-2 text-green-500" />
              No changes detected
            </div>
          ) : (
            <>
              {/* AI Summary */}
              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-800 text-xs">AI Analysis:</div>
                    <div className="text-blue-700 text-xs">{aiSummary}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setShowDiffView(!showDiffView)}
                  className="text-xs bg-white border border-light px-3 py-1 rounded hover:bg-gray-50 transition-colors"
                >
                  {showDiffView ? "Hide" : "Show"} Diff View
                </button>
                
                <button
                  onClick={onReintegrate}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                >
                  Reintegrate into AI
                </button>
                
                <button
                  onClick={onRevert}
                  className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Undo Changes
                </button>
              </div>

              {/* Diff View */}
              {showDiffView && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-medium text-muted mb-2">Original Code:</div>
                    <pre className="bg-gray-100 p-3 rounded border h-40 overflow-auto font-mono">
                      {originalCode}
                    </pre>
                  </div>
                  <div>
                    <div className="font-medium text-muted mb-2">Modified Code:</div>
                    <pre className="bg-green-50 p-3 rounded border h-40 overflow-auto font-mono">
                      {modifiedCode}
                    </pre>
                  </div>
                </div>
              )}

              {/* Change List */}
              <div className="space-y-1">
                {diffs.map((diff, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${
                      diff.type === 'added' ? 'bg-green-50 border border-green-200' :
                      diff.type === 'removed' ? 'bg-red-50 border border-red-200' :
                      'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <div className="font-medium mb-1">
                      Line {diff.line}: {diff.type === 'added' ? 'Added' : diff.type === 'removed' ? 'Removed' : 'Changed'}
                    </div>
                    {diff.type !== 'added' && (
                      <div className="text-red-700">- {diff.original}</div>
                    )}
                    {diff.type !== 'removed' && (
                      <div className="text-green-700">+ {diff.modified}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}