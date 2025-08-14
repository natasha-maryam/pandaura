import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, FileText, X, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui';
import { TagsAPI } from './api';

interface BeckhoffImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onSuccess?: (importedCount: number) => void;
}

type ImportFormat = 'csv' | 'xml';
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

export default function BeckhoffImportModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess
}: BeckhoffImportModalProps) {
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

  const handleFileUpload = async () => {
    if (!state.selectedFile || !state.selectedFormat) return;

    setState(prev => ({ ...prev, step: 'progress' }));

    try {
      let result;
      if (state.selectedFormat === 'csv') {
        result = await TagsAPI.importBeckhoffCsv(projectId, state.selectedFile);
      } else if (state.selectedFormat === 'xml') {
        result = await TagsAPI.importBeckhoffXml(projectId, state.selectedFile);
      } else {
        throw new Error('Invalid format selected');
      }

      setState(prev => ({ 
        ...prev, 
        step: result.success ? 'success' : 'error',
        importResult: result,
        errorMessage: result.success ? undefined : 'Import completed with errors'
      }));

      if (result.success && result.inserted && onSuccess) {
        onSuccess(result.inserted);
      }
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        errorMessage 
      }));
    }
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, step: 'select', selectedFile: undefined, errorMessage: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGoBack = () => {
    setState(prev => ({ 
      ...prev, 
      step: 'select', 
      selectedFile: undefined, 
      selectedFormat: undefined,
      errorMessage: undefined 
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setState({ step: 'select' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        state.step === 'select' ? 'Import Beckhoff Tags' :
        state.step === 'upload' ? 'Select File to Import' :
        state.step === 'progress' ? 'Importing Tags' :
        state.step === 'success' ? 'Import Complete!' :
        'Import Failed'
      }
      size="md"
    >
      <div className="space-y-6">
        {/* Step 1: Select Import Format */}
        {state.step === 'select' && (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Select the format of your Beckhoff tag export file:
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => handleFormatSelect('csv')}
                className="border rounded-lg p-4 cursor-pointer transition-colors border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <div className="text-center">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium">CSV Format</div>
                  <div className="text-sm text-gray-500 mt-1">
                    TwinCAT CSV export
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleFormatSelect('xml')}
                className="border rounded-lg p-4 cursor-pointer transition-colors border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <div className="text-center">
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">XML Format</div>
                  <div className="text-sm text-gray-500 mt-1">
                    TwinCAT ADS XML
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Tip:</strong> Export your tags from TwinCAT 3 using either CSV format or XML (ADS) format.
                  Make sure the export includes tag names, data types, and addresses.
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Step 2: File Upload */}
        {state.step === 'upload' && (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Select your Beckhoff {state.selectedFormat?.toUpperCase()} file to import into project '{projectName}':
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Choose {state.selectedFormat?.toUpperCase()} file
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Or drag and drop your file here
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={state.selectedFormat === 'csv' ? '.csv' : '.xml'}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                Select File
              </button>
            </div>

            {state.selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <div className="text-sm text-green-800">
                    <strong>Selected:</strong> {state.selectedFile.name} ({Math.round(state.selectedFile.size / 1024)} KB)
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Important:</strong> This will import new tags and update existing ones with the same name.
                  Make sure to review your data before importing.
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleGoBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!state.selectedFile}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Tags
              </button>
            </div>
          </>
        )}

        {/* Step 3: Import in Progress */}
        {state.step === 'progress' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Importing your tags...
            </div>
            <div className="text-sm text-gray-600">
              Please do not close this window.
            </div>
          </div>
        )}

        {/* Step 4: Import Success */}
        {state.step === 'success' && (
          <>
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Import Successful!
              </div>
              <div className="text-sm text-gray-600">
                Successfully imported {state.importResult?.inserted} tags into '{projectName}'.
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}

        {/* Step 5: Import Error */}
        {state.step === 'error' && (
          <>
            <div className="text-center py-4">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Import Failed
              </div>
              <div className="text-sm text-gray-600 mb-4">
                {state.errorMessage}
              </div>

              {/* Show detailed errors if available */}
              {state.importResult?.errors && state.importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="text-left text-sm text-red-800">
                    <strong>Errors found:</strong>
                    <ul className="mt-2 space-y-1">
                      {state.importResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="flex">
                          <span className="font-medium mr-2">Row {error.row}:</span>
                          <span>{error.errors.join(', ')}</span>
                        </li>
                      ))}
                      {state.importResult.errors.length > 10 && (
                        <li className="text-gray-600">
                          ... and {state.importResult.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
