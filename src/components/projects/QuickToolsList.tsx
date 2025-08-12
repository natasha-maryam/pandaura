import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui';
import { QuickTool } from './types';

interface QuickToolsListProps {
  tools: QuickTool[];
  onBack: () => void;
}

export default function QuickToolsList({ tools, onBack }: QuickToolsListProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Quick Tools Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={onBack}
          variant="ghost"
          icon={ChevronLeft}
          size="sm"
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">Quick Tools</h1>
          <p className="text-secondary">Single-use sessions for quick tasks and testing</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-4">
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => !tool.comingSoon && navigate(tool.path)}
            disabled={tool.comingSoon}
            className={`flex items-center gap-4 p-6 bg-surface rounded-lg border border-light transition-all text-left relative ${
              tool.comingSoon 
                ? 'opacity-75 cursor-not-allowed' 
                : 'hover:border-accent hover:shadow-sm'
            }`}
          >
            <div className={`p-3 rounded-lg ${tool.comingSoon ? 'bg-gray-100' : 'bg-accent-light'}`}>
              <tool.icon className={`w-6 h-6 ${tool.comingSoon ? 'text-gray-400' : 'text-accent'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-primary">{tool.name}</h3>
                {tool.comingSoon && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-secondary">{tool.description}</p>
            </div>
            {!tool.comingSoon && <ArrowRight className="w-5 h-5 text-muted flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
