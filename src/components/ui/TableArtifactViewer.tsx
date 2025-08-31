import React from 'react';
import { TableArtifact } from '../../types/ai';
import  Card  from './Card';

interface Props {
  artifact: TableArtifact;
}

export const TableArtifactViewer: React.FC<Props> = ({ artifact }) => {
  // Don't render if there's no actual data
  if (!artifact || !artifact.schema || artifact.schema.length === 0 || !artifact.rows || artifact.rows.length === 0) {
    return null;
  }

  return (
    <Card className="my-4">
      <div className="mb-2">
        <h3 className="text-lg font-semibold">{artifact.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {artifact.schema.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {artifact.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

