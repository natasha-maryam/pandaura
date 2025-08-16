import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, Eye, RotateCcw, Clock, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { Button, Card } from '../ui';
import { ProjectVersion } from '../projects/api';
import VersionDiffViewer from '../ui/VersionDiffViewer';

interface VersionHistoryProps {
  versions: ProjectVersion[];
  isLoading?: boolean;
  error?: string | null;
  onViewDiff?: (version: ProjectVersion) => void;
  onRollback: (version: ProjectVersion) => void;
  onDelete?: (version: ProjectVersion) => void;
  onRefresh?: () => void;
  projectId?: number;
}

export default function VersionHistory({
  versions,
  isLoading = false,
  error = null,
  onViewDiff,
  onRollback,
  onDelete,
  onRefresh,
  projectId
}: VersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const versionsPerPage = 5;
  const [diffViewerOpen, setDiffViewerOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<{ from: number; to: number } | null>(null);

  // Sort versions by version_number descending (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);
  
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
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              onClick={() => {
                onRefresh();
              }}
              className={`p-1 ${isLoading ? 'animate-spin' : ''}`}
              title="Refresh version history"
            />
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-muted mx-auto mb-3 animate-spin" />
              <p className="text-secondary">Loading version history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 mb-2">Failed to load version history</p>
              <p className="text-sm text-muted mb-4">{error}</p>
              {onRefresh && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={RefreshCw}
                  onClick={onRefresh}
                >
                  Try Again
                </Button>
              )}
            </div>
          ) : sortedVersions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-secondary">No version history available</p>
              <p className="text-sm text-muted mt-2">Versions will appear here as you save your project</p>
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
                            Version {version.version_number}
                          </span>
                          {isLatest && (
                            <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            version.is_auto
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {version.is_auto ? 'Auto-save' : 'Manual'}
                          </span>
                        </div>
                        <div className="text-sm text-secondary mb-1">
                          <span className="font-medium">User {version.user_id}</span> • {formatTimestamp(version.created_at)}
                        </div>
                        {version.message && (
                          <p className="text-sm text-muted">{version.message}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted mt-2">
                          <span>
                            Created {new Date(version.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {/* Compare with previous version */}
                        {index < sortedVersions.length - 1 && projectId && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Eye}
                            onClick={() => {
                              const previousVersion = sortedVersions[index + 1];
                              setSelectedVersions({
                                from: previousVersion.version_number,
                                to: version.version_number
                              });
                              setDiffViewerOpen(true);
                            }}
                            title="Compare with previous version"
                          >
                            Diff
                          </Button>
                        )}

                        {/* Legacy view diff handler */}
                        {onViewDiff && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Eye}
                            onClick={() => onViewDiff(version)}
                            title="View Changes"
                          >
                            View
                          </Button>
                        )}

                        {!isLatest && (
                          <>
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
                            {onDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Trash2}
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete version ${version.version_number}? This action cannot be undone.`)) {
                                    onDelete(version);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete this version"
                              >
                                Delete
                              </Button>
                            )}
                          </>
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

      {/* Version Diff Viewer */}
      {projectId && selectedVersions && (
        <VersionDiffViewer
          projectId={projectId}
          fromVersion={selectedVersions.from}
          toVersion={selectedVersions.to}
          isOpen={diffViewerOpen}
          onClose={() => {
            setDiffViewerOpen(false);
            setSelectedVersions(null);
          }}
        />
      )}
    </Card>
  );
}
