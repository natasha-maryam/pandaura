import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, FileText, X, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui';
import { TagsAPI } from './api';

interface RockwellImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onSuccess?: (importedCount: number) => void;
}

type ImportFormat = 'csv' | 'l5x';
type ImportStep = 'select' | 'upload' | 'progress' | 'success' | 'error';

interface ImportState {
  step: ImportStep;
  selectedFormat?: ImportFormat;
  selectedFile?: File;
  errorMessage?: string;
  importResult?: {
    success: boolean;
    inserted?: number;
    errors?: Array<{ row: number; errors: string[]; raw: any }>;
    processed?: number;
  };
}

export default function RockwellImportModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess
}: RockwellImportModalProps) {
  const [state, setState] = useState<ImportState>({ step: 'select' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setState({ step: 'select' });
    }
  }, [isOpen]);

  const handleFormatSelect = (format: ImportFormat) => {
    setState(prev => ({ ...prev, selectedFormat: format, step: 'upload' }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setState(prev => ({ ...prev, selectedFile: file }));
    }
  };

  const handleImport = async () => {
    if (!state.selectedFile || !state.selectedFormat) return;

    setState(prev => ({ ...prev, step: 'progress' }));

    try {
      let result;
      if (state.selectedFormat === 'csv') {
        result = await TagsAPI.importRockwellCsv(projectId, state.selectedFile);
      } else if (state.selectedFormat === 'l5x') {
        result = await TagsAPI.importRockwellL5X(projectId, state.selectedFile);
      } else {
        throw new Error('Unsupported format');
      }

      setState(prev => ({ 
        ...prev, 
        step: result.success ? 'success' : 'error',
        importResult: result,
        errorMessage: result.success ? undefined : 'Import completed with errors'
      }));

      if (result.success && onSuccess && result.inserted) {
        onSuccess(result.inserted);
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        errorMessage: error instanceof Error ? error.message : 'Import failed'
      }));
    }
  };

  const handleReset = () => {
    setState({ step: 'select' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const renderStepContent = () => {
    switch (state.step) {
      case 'select':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Rockwell Import Format</h3>
              <p className="text-sm text-gray-600">
                Choose the format of your Rockwell (Allen-Bradley) tag file to import.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleFormatSelect('csv')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 focus:outline-none focus:border-blue-500 transition-colors text-left"
              >
                <div className="flex items-start space-x-3">
                  <FileText className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">CSV Format</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Standard CSV export from Studio 5000 Tag Database Manager. Supports tag names, data types, addresses, and descriptions.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted file extensions: .csv
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleFormatSelect('l5x')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 focus:outline-none focus:border-blue-500 transition-colors text-left"
              >
                <div className="flex items-start space-x-3">
                  <FileText className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">L5X Format</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      XML-based L5X export from Studio 5000. Provides structured tag definitions with metadata.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted file extensions: .l5x, .xml
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Import Guidelines & Address Formats</h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Ensure your file contains proper Rockwell tag definitions</li>
                    <li>• Duplicate tag names will be updated with new values</li>
                    <li>• <strong>Address formats:</strong> I:x/y (Input), O:x/y (Output), Nx:y (Integer), Fx:y (Float), or symbolic names</li>
                    <li>• <strong>Valid examples:</strong> I:1/0, O:2/0, N7:0, F8:0, B3:1, MyTag_1</li>
                    <li>• Invalid addresses will be reported as errors</li>
                    <li>• Large files may take several seconds to process</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Rockwell File</h3>
              <p className="text-sm text-gray-600">
                Upload your {state.selectedFormat?.toUpperCase()} file to import Rockwell tags into "{projectName}".
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block">
                      Select File
                    </span>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept={state.selectedFormat === 'csv' ? '.csv' : '.l5x,.xml'}
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-600">
                    or drag and drop your file here
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {state.selectedFormat?.toUpperCase()} files only, up to 10MB
                </p>
              </div>
            </div>

            {state.selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">File Selected</p>
                    <p className="text-sm text-green-700">
                      {state.selectedFile.name} ({(state.selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={!state.selectedFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Import Tags
              </button>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Processing Rockwell Import</h3>
              <p className="text-sm text-gray-600 mt-2">
                Reading and validating your {state.selectedFormat?.toUpperCase()} file...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Import Successful!</h3>
              <p className="text-sm text-gray-600 mt-2">
                Successfully imported {state.importResult?.inserted || 0} Rockwell tags.
              </p>
            </div>

            {state.importResult?.errors && state.importResult.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Warnings ({state.importResult.errors.length} rows skipped)
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  {state.importResult.errors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-xs text-yellow-700">
                      Row {error.row}: {error.errors.join(', ')}
                    </p>
                  ))}
                  {state.importResult.errors.length > 5 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ...and {state.importResult.errors.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Done
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Import Failed</h3>
              <p className="text-sm text-gray-600 mt-2">
                {state.errorMessage || 'An unexpected error occurred during import.'}
              </p>
            </div>

            {state.importResult?.errors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h4 className="text-sm font-medium text-red-800 mb-2">Error Details:</h4>
                {state.importResult.errors.map((error, idx) => (
                  <div key={idx} className="text-sm text-red-700 mb-2">
                    <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Rockwell Tags">
      <div className="max-w-2xl">
        {renderStepContent()}
      </div>
    </Modal>
  );
}
