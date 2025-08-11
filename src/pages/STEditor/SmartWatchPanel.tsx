import React, { useState } from "react";
import { Eye, Pin, AlertTriangle, Activity, Clock, X } from "lucide-react";

interface WatchVariable {
  name: string;
  value: string | number | boolean;
  type: 'BOOL' | 'INT' | 'REAL' | 'STRING';
  isPinned: boolean;
  isAICritical: boolean;
  alert?: {
    type: 'warning' | 'error' | 'info';
    message: string;
  };
  activity?: {
    changes: number;
    timespan: string;
  };
}

interface Props {
  variables: WatchVariable[];
  onPin: (varName: string) => void;
  onUnpin: (varName: string) => void;
  isSimulationActive: boolean;
}

export default function SmartWatchPanel({ variables, onPin, onUnpin, isSimulationActive }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const criticalVars = variables.filter(v => v.isAICritical || v.isPinned);
  const alertVars = variables.filter(v => v.alert);

  const getValueColor = (variable: WatchVariable) => {
    if (variable.alert?.type === 'error') return 'text-red-600';
    if (variable.alert?.type === 'warning') return 'text-yellow-600';
    if (variable.type === 'BOOL') {
      return variable.value ? 'text-green-600' : 'text-gray-500';
    }
    return 'text-primary';
  };

  const formatValue = (value: string | number | boolean) => {
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  };

  return (
    <div className="bg-white border border-light rounded-md shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Smart Watch Panel</span>
            {isSimulationActive && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Activity className="w-3 h-3" />
                Live
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {alertVars.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                {alertVars.length} alert{alertVars.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted hover:text-primary"
            >
              {collapsed ? '+' : '−'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="p-3 max-h-64 overflow-y-auto">
          {criticalVars.length === 0 ? (
            <div className="text-center text-muted text-sm py-4">
              <Eye className="w-5 h-5 mx-auto mb-2 opacity-50" />
              No critical variables detected
              <div className="text-xs mt-1">AI will suggest important tags to watch</div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Alert Variables First */}
              {alertVars.map((variable, index) => (
                <div
                  key={`alert-${index}`}
                  className={`p-2 rounded border-l-4 ${
                    variable.alert?.type === 'error' ? 'bg-red-50 border-red-400' :
                    variable.alert?.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${
                        variable.alert?.type === 'error' ? 'text-red-500' :
                        variable.alert?.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <span className="font-mono text-sm font-medium">{variable.name}</span>
                      <span className={`text-sm font-mono ${getValueColor(variable)}`}>
                        {formatValue(variable.value)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => variable.isPinned ? onUnpin(variable.name) : onPin(variable.name)}
                      className={`p-1 rounded ${
                        variable.isPinned ? 'text-accent' : 'text-muted hover:text-primary'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="text-xs text-muted mt-1">
                    {variable.alert?.message}
                  </div>
                  
                  {variable.activity && (
                    <div className="flex items-center gap-1 text-xs text-muted mt-1">
                      <Clock className="w-3 h-3" />
                      {variable.activity.changes} changes in {variable.activity.timespan}
                    </div>
                  )}
                </div>
              ))}

              {/* Regular Critical Variables */}
              {criticalVars.filter(v => !v.alert).map((variable, index) => (
                <div key={`critical-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{variable.name}</span>
                    <span className={`text-sm font-mono ${getValueColor(variable)}`}>
                      {formatValue(variable.value)}
                    </span>
                    {variable.isAICritical && (
                      <span className="text-xs bg-accent-light text-accent px-1 rounded">AI</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {variable.activity && (
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Activity className="w-3 h-3" />
                        {variable.activity.changes}x
                      </div>
                    )}
                    <button
                      onClick={() => variable.isPinned ? onUnpin(variable.name) : onPin(variable.name)}
                      className={`p-1 rounded ${
                        variable.isPinned ? 'text-accent' : 'text-muted hover:text-primary'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}