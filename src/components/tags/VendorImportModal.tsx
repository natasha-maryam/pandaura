import React, { useState, useEffect, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, FileText, X, AlertTriangle, Download } from 'lucide-react';
import { Modal } from '../ui';
import { TagsAPI } from './api';

interface VendorImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onSuccess?: (importedCount: number) => void;
}

type Vendor = 'rockwell' | 'beckhoff';
type Format = 'csv' | 'xml' | 'l5x';

interface ImportOption {
  vendor: Vendor;
  formats: Format[];
  displayName: string;
  description: string;
}

const importOptions: ImportOption[] = [
  {
    vendor: 'rockwell',
    formats: ['csv', 'l5x'],
    displayName: 'Rockwell (Allen-Bradley)',
    description: 'Import tags from Studio 5000 CSV exports or L5X XML files'
  },
  {
    vendor: 'beckhoff',
    formats: ['csv', 'xml'],
    displayName: 'Beckhoff (TwinCAT)',
    description: 'Import tags from TwinCAT CSV exports or XML files'
  }
];

type ImportStep = 'select' | 'upload' | 'progress' | 'success' | 'error';

interface ImportState {
  step: ImportStep;
  selectedVendor?: Vendor;
  selectedFormat?: Format;
  selectedFile?: File;
  errorMessage?: string;
  importResult?: {
    success: boolean;
    inserted?: number;
    errors?: Array<{ row: number; errors: string[]; raw: any }>;
    processed?: number;
  };
}

export default function VendorImportModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess
}: VendorImportModalProps) {
  const [state, setState] = useState<ImportState>({ step: 'select' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState({ step: 'select' });
    }
  }, [isOpen]);

  const handleVendorSelect = (vendor: Vendor) => {
    setState(prev => ({ ...prev, selectedVendor: vendor }));
  };

  const handleFormatSelect = (format: Format) => {
    setState(prev => ({ ...prev, selectedFormat: format, step: 'upload' }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setState(prev => ({ ...prev, selectedFile: file }));
    }
  };

  const handleUpload = async () => {
    if (!state.selectedFile || !state.selectedVendor || !state.selectedFormat) return;

    setState(prev => ({ ...prev, step: 'progress' }));

    try {
      let result;

      // Call the appropriate import API based on vendor and format
      if (state.selectedVendor === 'beckhoff') {
        if (state.selectedFormat === 'csv') {
          result = await TagsAPI.importBeckhoffCsv(projectId, state.selectedFile);
        } else if (state.selectedFormat === 'xml') {
          result = await TagsAPI.importBeckhoffXml(projectId, state.selectedFile);
        }
      } else if (state.selectedVendor === 'rockwell') {
        if (state.selectedFormat === 'csv') {
          result = await TagsAPI.importRockwellCsv(projectId, state.selectedFile);
        } else if (state.selectedFormat === 'l5x') {
          result = await TagsAPI.importRockwellL5X(projectId, state.selectedFile);
        }
      }

      if (!result) {
        throw new Error('Unsupported import combination');
      }

      setState(prev => ({ 
        ...prev, 
        step: 'success', 
        importResult: result 
      }));

      // Call success callback
      if (onSuccess && result.inserted) {
        onSuccess(result.inserted);
      }

    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Handle network errors specifically
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error occurred. Please check your connection and try again.';
      }
      
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        errorMessage 
      }));
    }
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, step: 'select' }));
  };

  const handleGoBack = () => {
    setState(prev => ({ ...prev, step: 'select' }));
  };

  const handleReset = () => {
    setState({ step: 'select' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileAccept = () => {
    if (!state.selectedFormat) return '';
    
    switch (state.selectedFormat) {
      case 'csv':
        return '.csv,text/csv';
      case 'xml':
        return '.xml,text/xml,application/xml';
      case 'l5x':
        return '.l5x,.xml,text/xml,application/xml';
      default:
        return '';
    }
  };

  const getFileExtensions = () => {
    if (!state.selectedFormat) return '';
    
    switch (state.selectedFormat) {
      case 'csv':
        return 'CSV files (.csv)';
      case 'xml':
        return 'XML files (.xml)';
      case 'l5x':
        return 'L5X files (.l5x)';
      default:
        return '';
    }
  };

  const selectedOption = importOptions.find(opt => opt.vendor === state.selectedVendor);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Tags"
      size="lg"
    >
      <div className="space-y-6">
        {/* Step 1: Select Vendor and Format */}
        {state.step === 'select' && (
          <>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Import Tags to "{projectName}"
              </h3>
              <p className="text-gray-600">
                Select the vendor and format of your tag file to import
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Vendor
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {importOptions.map((option) => (
                    <button
                      key={option.vendor}
                      onClick={() => handleVendorSelect(option.vendor)}
                      className={`
                        p-4 border-2 rounded-lg text-left transition-all
                        ${state.selectedVendor === option.vendor 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="font-medium text-gray-900">
                        {option.displayName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {state.selectedVendor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOption?.formats.map((format) => (
                      <button
                        key={format}
                        onClick={() => handleFormatSelect(format)}
                        className={`
                          p-3 border-2 rounded-lg text-center font-medium transition-all
                          ${state.selectedFormat === format 
                            ? 'border-primary bg-primary text-white' 
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: File Upload */}
        {state.step === 'upload' && (
          <>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload {selectedOption?.displayName} {state.selectedFormat?.toUpperCase()} File
              </h3>
              <p className="text-gray-600">
                Select your {getFileExtensions()} file to import tags
              </p>
            </div>

            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getFileAccept()}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-900 mb-2">
                  {state.selectedFile ? state.selectedFile.name : 'Choose file to upload'}
                </div>
                <div className="text-gray-600">
                  {state.selectedFile 
                    ? `Size: ${(state.selectedFile.size / 1024).toFixed(1)} KB` 
                    : `Click to browse or drag and drop your ${getFileExtensions()}`
                  }
                </div>
              </div>

              {state.selectedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-600 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium text-green-900">{state.selectedFile.name}</div>
                      <div className="text-sm text-green-700">
                        {(state.selectedFile.size / 1024).toFixed(1)} KB • Ready to import
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleGoBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
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
              Please do not close this window while the import is processing.
            </div>
          </div>
        )}

        {/* Step 4: Import Success */}
        {state.step === 'success' && (
          <>
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-900 mb-2">
                Import completed successfully!
              </div>
              <div className="text-gray-600 mb-4">
                {state.importResult?.inserted || 0} tags were imported into "{projectName}"
              </div>
              
              {state.importResult?.errors && state.importResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-yellow-800 mb-2">
                        {state.importResult.errors.length} rows had issues:
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                        {state.importResult.errors.slice(0, 5).map((error, idx) => (
                          <div key={idx}>
                            Row {error.row}: {error.errors.join(', ')}
                          </div>
                        ))}
                        {state.importResult.errors.length > 5 && (
                          <div className="text-yellow-600 italic">
                            ... and {state.importResult.errors.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Import More
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}

        {/* Step 5: Import Error */}
        {state.step === 'error' && (
          <>
            <div className="text-center py-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-900 mb-2">
                Import failed
              </div>
              <div className="text-gray-600 mb-2">
                <strong>Error:</strong> {state.errorMessage}
              </div>
              <div className="text-sm text-gray-500 mb-6">
                Please check your file format and try again, or contact support if the problem persists.
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={onClose}
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
