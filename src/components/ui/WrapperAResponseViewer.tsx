import React from 'react';
import { WrapperAResponse, CodeArtifact } from '../../types/ai';
import  Card  from './Card';
import { CodeArtifactViewer } from './CodeArtifactViewer';
import { TableArtifactViewer } from './TableArtifactViewer';
import ReactMarkdown from 'react-markdown';

interface Props {
  response: WrapperAResponse;
  onSaveToProject?: (artifact: CodeArtifact) => void;
  onMoveToLogicStudio?: (artifact: CodeArtifact) => void;
  hideStatusAndTaskType?: boolean;
}

export const WrapperAResponseViewer: React.FC<Props> = ({
  response,
  onSaveToProject,
  onMoveToLogicStudio,
  hideStatusAndTaskType = false,
}) => {
  // Check if there are meaningful artifacts that warrant showing the full viewer
  const hasMeaningfulArtifacts = 
    response.artifacts.code.length > 0 ||
    response.artifacts.tables.length > 0 ||
    response.artifacts.diff ||
    (response.artifacts.reports && response.artifacts.reports.length > 0);

  // Don't render anything if there are no meaningful artifacts
  if (!hasMeaningfulArtifacts) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Status and Task Type - Only show when not hidden and for meaningful artifacts */}
      {!hideStatusAndTaskType && (
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-sm ${
            response.status === 'ok'
              ? 'bg-green-100 text-green-800'
              : response.status === 'needs_input'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {response.status.toUpperCase()}
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            {response.task_type}
          </span>
        </div>
      )}

      {/* Assumptions */}
      {response.assumptions.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">Assumptions</h3>
          <ul className="list-disc list-inside space-y-1">
            {response.assumptions.map((assumption, index) => (
              <li key={index} className="text-sm text-gray-600">
                {assumption}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Main Answer - Only show if there's content */}
      {response.answer_md && response.answer_md.trim() && (
        <Card>
          <div className="prose max-w-none">
            <ReactMarkdown>{response.answer_md}</ReactMarkdown>
          </div>
        </Card>
      )}

      {/* Code Artifacts */}
      {response.artifacts.code.map((artifact, index) => (
        <CodeArtifactViewer
          key={index}
          artifact={artifact}
          onSaveToProject={onSaveToProject}
          onMoveToLogicStudio={onMoveToLogicStudio}
        />
      ))}

      {/* Table Artifacts - Only show for non-doc_qa tasks to avoid duplication */}
      {response.task_type !== 'doc_qa' && response.artifacts.tables.map((artifact, index) => (
        <TableArtifactViewer key={index} artifact={artifact} />
      ))}

      {/* Report Artifacts (Wrapper B) */}
      {response.artifacts.reports && response.artifacts.reports.map((report: any, index: number) => (
        <Card key={index}>
          <h3 className="font-semibold mb-2">{report.title}</h3>
          <div className="prose max-w-none">
            <ReactMarkdown>{report.content_md}</ReactMarkdown>
          </div>
        </Card>
      ))}

      {/* Anchors (Wrapper B) */}
      {response.artifacts.anchors && response.artifacts.anchors.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">Document References</h3>
          <ul className="list-disc list-inside space-y-1">
            {response.artifacts.anchors.map((anchor: any, index: number) => (
              <li key={index} className="text-sm text-gray-600">
                <strong>{anchor.file}</strong>
                {anchor.page && ` (page ${anchor.page})`}: {anchor.note}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Diff View */}
      {response.artifacts.diff && (
        <Card>
          <h3 className="font-semibold mb-2">Changes</h3>
          <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
            <code className="text-sm font-mono whitespace-pre">
              {response.artifacts.diff}
            </code>
          </pre>
        </Card>
      )}

      {/* Citations */}
      {response.artifacts.citations.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">References</h3>
          <ul className="list-disc list-inside space-y-1">
            {response.artifacts.citations.map((citation, index) => (
              <li key={index} className="text-sm text-gray-600">
                {citation}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Next Actions */}
      {response.next_actions.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">Next Steps</h3>
          <ul className="list-disc list-inside space-y-1">
            {response.next_actions.map((action, index) => (
              <li key={index} className="text-sm text-gray-600">
                {action}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Processed Files (Wrapper B) */}
      {response.processed_files && response.processed_files.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">Processed Files</h3>
          <div className="space-y-2">
            {response.processed_files.map((file: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-sm">{file.filename}</span>
                  <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{file.type}</span>
                  {file.extracted_data_available && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Data Extracted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Errors */}
      {response.errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <h3 className="font-semibold mb-2 text-red-800">Errors</h3>
          <ul className="list-disc list-inside space-y-1">
            {response.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600">
                {error}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

