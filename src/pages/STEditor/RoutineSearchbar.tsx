import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Code, FileText, Zap } from "lucide-react";

interface SearchResult {
  id: string;
  type: 'routine' | 'block' | 'variable' | 'comment';
  title: string;
  description: string;
  line: number;
  routine: string;
  preview: string;
  confidence: number;
}

interface Props {
  onSearch: (query: string) => SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  placeholder?: string;
}

export default function RoutineSearchbar({ 
  onSearch, 
  onSelectResult, 
  placeholder = "Search routines, logic, variables..." 
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock search function with realistic results
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Simulate AI-powered semantic search
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'routine' as const,
        title: 'Conveyor_2_Start',
        description: 'Motor starter routine for conveyor 2',
        line: 45,
        routine: 'Main',
        preview: 'IF Start_Button AND NOT E_Stop THEN Conveyor_2_Run := TRUE;',
        confidence: 95
      },
      {
        id: '2',
        type: 'block' as const,
        title: 'Overload Protection Logic',
        description: 'Motor overload detection and response',
        line: 78,
        routine: 'Safety_Check',
        preview: 'IF Motor_Current > Max_Current THEN Overload_Fault := TRUE;',
        confidence: 87
      },
      {
        id: '3',
        type: 'variable' as const,
        title: 'Conveyor_2_Status',
        description: 'Boolean status indicator for conveyor 2',
        line: 12,
        routine: 'Main',
        preview: 'VAR Conveyor_2_Status : BOOL := FALSE;',
        confidence: 92
      }
    ].filter(result => 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(mockResults);
    setIsOpen(mockResults.length > 0);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setQuery(result.title);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'routine': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'block': return <Code className="w-4 h-4 text-green-500" />;
      case 'variable': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'comment': return <MapPin className="w-4 h-4 text-gray-500" />;
      default: return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(results.length > 0)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-light rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={result.id}
              onClick={() => handleSelectResult(result)}
              className={`p-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-accent-light' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {getResultIcon(result.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-primary truncate">
                      {result.title}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">
                      {result.confidence}%
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted mb-1">
                    {result.description}
                  </div>
                  
                  <div className="text-xs text-muted">
                    <span className="font-mono">{result.routine}</span> • Line {result.line}
                  </div>
                  
                  <div className="text-xs font-mono bg-gray-50 p-1 rounded mt-1 truncate">
                    {result.preview}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 text-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-light rounded-md shadow-lg z-50 p-3">
          <div className="text-center text-muted text-sm">
            <Search className="w-5 h-5 mx-auto mb-1 opacity-50" />
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}