import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, Eye, RotateCcw, Clock } from 'lucide-react';
import { Button, Card } from '../ui';
import { ProjectVersion } from './types';

interface VersionHistoryProps {
  versions: ProjectVersion[];
  onViewDiff: (version: ProjectVersion) => void;
  onRollback: (version: ProjectVersion) => void;
}

export default function VersionHistory({ versions, onViewDiff, onRollback }: VersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const versionsPerPage = 5;

  // Sort versions by ID descending (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.id - a.id);
  
  // Pagination
  const totalPages = Math.ceil(sortedVersions.length / versionsPerPage);
  const startIndex = (currentPage - 1) * versionsPerPage;
  const endIndex = startIndex + versionsPerPage;
  const currentVersions = sortedVersions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b border-light hover:bg-background transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-primary">Version History</h3>
          <span className="text-sm text-muted">({sortedVersions.length} versions)</span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {sortedVersions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-secondary">No version history available</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {currentVersions.map((version, index) => {
                  const isLatest = startIndex + index === 0;
                  return (
                    <div
                      key={version.id}
                      className={`flex items-center justify-between p-4 rounded-md border transition-colors ${
                        isLatest 
                          ? 'bg-accent-light border-accent' 
                          : 'bg-background border-light hover:border-accent'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-primary">
                            Version {version.id}
                          </span>
                          {isLatest && (
                            <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            version.type === 'Autosave' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {version.type}
                          </span>
                        </div>
                        <div className="text-sm text-secondary mb-1">
                          <span className="font-medium">{version.user}</span> • {formatTimestamp(version.timestamp)}
                        </div>
                        {version.message && (
                          <p className="text-sm text-muted">{version.message}</p>
                        )}
                        {version.changes && version.changes.length > 0 && (
                          <div className="flex items-center gap-4 text-xs text-muted mt-2">
                            <span className="text-green-600">
                              +{version.changes.reduce((sum, change) => sum + change.linesAdded, 0)} lines
                            </span>
                            <span className="text-red-600">
                              -{version.changes.reduce((sum, change) => sum + change.linesRemoved, 0)} lines
                            </span>
                            <span>
                              {version.changes.length} file{version.changes.length !== 1 ? 's' : ''} changed
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Eye}
                          onClick={() => onViewDiff(version)}
                          title="View Changes"
                        >
                          View
                        </Button>
                        {!isLatest && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={RotateCcw}
                            onClick={() => onRollback(version)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Rollback to this version"
                          >
                            Rollback
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-light">
                  <div className="text-sm text-secondary">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedVersions.length)} of {sortedVersions.length} versions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? 'primary' : 'ghost'}
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
