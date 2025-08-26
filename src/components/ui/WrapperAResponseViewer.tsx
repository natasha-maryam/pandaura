import React from 'react';
import { WrapperAResponse, CodeArtifact } from '../../types/ai';
import { Card } from './Card';
import { CodeArtifactViewer } from './CodeArtifactViewer';
import { TableArtifactViewer } from './TableArtifactViewer';
import ReactMarkdown from 'react-markdown';

interface Props {
  response: WrapperAResponse;
  onSaveToProject?: (artifact: CodeArtifact) => void;
  onMoveToLogicStudio?: (artifact: CodeArtifact) => void;
}

export const WrapperAResponseViewer: React.FC<Props> = ({
  response,
  onSaveToProject,
  onMoveToLogicStudio,
}) => {
  return (
    <div className="space-y-4">
      {/* Status and Task Type */}
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

      {/* Main Answer */}
      <Card>
        <div className="prose max-w-none">
          <ReactMarkdown>{response.answer_md}</ReactMarkdown>
        </div>
      </Card>

      {/* Code Artifacts */}
      {response.artifacts.code.map((artifact, index) => (
        <CodeArtifactViewer
          key={index}
          artifact={artifact}
          onSaveToProject={onSaveToProject}
          onMoveToLogicStudio={onMoveToLogicStudio}
        />
      ))}

      {/* Table Artifacts */}
      {response.artifacts.tables.map((artifact, index) => (
        <TableArtifactViewer key={index} artifact={artifact} />
      ))}

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

