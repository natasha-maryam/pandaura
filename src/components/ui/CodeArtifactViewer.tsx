import React from 'react';
import { CodeArtifact } from '../../types/ai';
import  Button  from './Button';
import  Card  from './Card';

interface Props {
  artifact: CodeArtifact;
  onSaveToProject?: (artifact: CodeArtifact) => void;
  onMoveToLogicStudio?: (artifact: CodeArtifact) => void;
}

export const CodeArtifactViewer: React.FC<Props> = ({
  artifact,
  onSaveToProject,
  onMoveToLogicStudio,
}) => {
  return (
    <Card className="my-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{artifact.filename}</span>
          <span className={`text-sm px-2 py-1 rounded ${
            artifact.compilable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {artifact.compilable ? 'Compilable' : 'Not Compilable'}
          </span>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {artifact.vendor}
          </span>
        </div>
        <div className="flex gap-2">
          {onMoveToLogicStudio && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onMoveToLogicStudio(artifact)}
            >
              Open in Logic Studio
            </Button>
          )}
          {onSaveToProject && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSaveToProject(artifact)}
            >
              Save to Project
            </Button>
          )}
        </div>
      </div>
      <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
        <code className="text-sm font-mono whitespace-pre">
          {artifact.content}
        </code>
      </pre>
    </Card>
  );
};

