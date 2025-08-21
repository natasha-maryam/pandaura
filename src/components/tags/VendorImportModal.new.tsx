import React, { useState, useEffect, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, FileText, AlertTriangle, Download } from 'lucide-react';
import { Modal } from '../ui';
import { TagsAPI } from './api';

interface VendorImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onSuccess?: (importedCount: number) => void;
}

type Vendor = 'rockwell' | 'beckhoff' | 'siemens';
type Format = 'csv' | 'xlsx' | 'xml' | 'l5x';
type ImportStep = 'upload' | 'detect' | 'manual-select' | 'progress' | 'success' | 'error';

interface ImportOption {
  vendor: Vendor;
  formats: Format[];
  displayName: string;
  description: string;
  supportedHeaders?: string[];
}

interface ImportResult {
  success: boolean;
  inserted?: number;
  errors?: Array<{ row: number; errors: string[]; raw: any }>;
  processed?: number;
  errorReport?: string; // Base64 encoded CSV error report
}

interface ImportState {
  step: ImportStep;
  selectedVendor?: Vendor;
  selectedFormat?: Format;
  selectedFile?: File;
  errorMessage?: string;
  detectedVendors?: Vendor[];
  detectedFormat?: Format;
  importResult?: ImportResult;
}

const importOptions: ImportOption[] = [
  {
    vendor: 'rockwell',
    formats: ['csv', 'l5x'],
    displayName: 'Rockwell (Allen-Bradley Studio 5000)',
    description: 'Import tags from Studio 5000 CSV exports or L5X XML files',
    supportedHeaders: ['Tag Name', 'Data Type', 'Scope', 'Description', 'External Access', 'Default Value', 'Address']
  },
  {
    vendor: 'siemens',
    formats: ['csv', 'xlsx', 'xml'],
    displayName: 'Siemens (TIA Portal)',
    description: 'Import tags from TIA Portal CSV/XLSX exports or PLCOpen XML'
  },
  {
    vendor: 'beckhoff',
    formats: ['csv', 'xml'],
    displayName: 'Beckhoff (TwinCAT)',
    description: 'Import tags from TwinCAT CSV exports or ADS XML files',
    supportedHeaders: ['Name', 'DataType', 'Address', 'Comment', 'InitialValue', 'Scope', 'AccessMode']
  }
];

export default function VendorImportModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess
}: VendorImportModalProps) {
  const [state, setState] = useState<ImportState>({ step: 'upload' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setState({ step: 'upload' });
    }
  }, [isOpen]);

  const handleVendorSelect = (vendor: Vendor) => {
    setState(prev => ({ ...prev, selectedVendor: vendor }));
  };

  const handleFormatSelect = async (format: Format) => {
    if (!state.selectedFile || !state.selectedVendor) return;
    setState(prev => ({ ...prev, selectedFormat: format, step: 'progress' }));
    await processImport(state.selectedVendor, format, state.selectedFile);
  };

  const processImport = async (vendor: Vendor, format: Format, file: File) => {
    setState(prev => ({ ...prev, step: 'progress' }));

    try {
      let result: ImportResult;

      if (vendor === 'beckhoff') {
        if (format === 'csv') {
          result = await TagsAPI.importBeckhoffCsv(projectId, file);
        } else if (format === 'xml') {
          result = await TagsAPI.importBeckhoffXml(projectId, file);
        } else {
          throw new Error('Unsupported format for Beckhoff');
        }
      } else if (vendor === 'siemens') {
        if (format === 'csv') {
          result = await TagsAPI.importSiemensCsv(projectId, file);
        } else {
          throw new Error('Unsupported format for Siemens');
        }
      } else if (vendor === 'rockwell') {
        if (format === 'csv') {
          result = await TagsAPI.importRockwellCsv(projectId, file);
        } else if (format === 'l5x') {
          result = await TagsAPI.importRockwellL5X(projectId, file);
        } else {
          throw new Error('Unsupported format for Rockwell');
        }
      } else {
        throw new Error('Unsupported vendor');
      }

      // Generate error report if there are errors
      if (result.errors && result.errors.length > 0) {
        const errorRows = ['Row,Errors'];
        result.errors.forEach(error => {
          errorRows.push(`${error.row},"${error.errors.join(', ')}"`);
        });
        result.errorReport = btoa(errorRows.join('\n'));
      }

      setState(prev => ({ 
        ...prev, 
        step: 'success', 
        importResult: result 
      }));

      if (onSuccess && result.inserted) {
        onSuccess(result.inserted);
      }

      window.dispatchEvent(new CustomEvent('pandaura:tags-imported', {
        detail: {
          projectId,
          importedCount: result.inserted
        }
      }));
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, selectedFile: file, step: 'detect' }));

    try {
      // Basic format detection based on extension
      const detectedVendors: Vendor[] = [];
      let detectedFormat: Format | undefined;

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv') detectedFormat = 'csv';
      else if (ext === 'xml') detectedFormat = 'xml';
      else if (ext === 'xlsx') detectedFormat = 'xlsx';
      else if (ext === 'l5x') detectedFormat = 'l5x';

      // Read file content for vendor detection
      const content = await file.text();
      const contentLower = content.toLowerCase();
      
      if (contentLower.includes('rockwell') || contentLower.includes('studio 5000') || contentLower.includes('allen-bradley'))
        detectedVendors.push('rockwell');
      if (contentLower.includes('siemens') || contentLower.includes('tia portal'))
        detectedVendors.push('siemens');
      if (contentLower.includes('beckhoff') || contentLower.includes('twincat'))
        detectedVendors.push('beckhoff');

      if (detectedVendors.length === 1 && detectedFormat) {
        // Single vendor and format detected - proceed with import
        setState(prev => ({
          ...prev,
          selectedVendor: detectedVendors[0],
          selectedFormat: detectedFormat,
          step: 'progress'
        }));
        await processImport(detectedVendors[0], detectedFormat, file);
      } else {
        // Multiple vendors or format not detected - manual selection needed
        setState(prev => ({
          ...prev,
          detectedVendors: detectedVendors,
          detectedFormat: detectedFormat,
          step: 'manual-select'
        }));
      }
    } catch (error) {
      console.error('Error detecting file format:', error);
      setState(prev => ({
        ...prev,
        step: 'manual-select'
      }));
    }
  };

  const handleReset = () => {
    setState({ step: 'upload' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, step: 'upload' }));
  };

  const selectedOption = importOptions.find(opt => opt.vendor === state.selectedVendor);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        state.step === 'upload' ? 'Import Tags' :
        state.step === 'detect' ? 'Detecting Format...' :
        state.step === 'manual-select' ? 'Select Format' :
        state.step === 'progress' ? 'Importing Tags' :
        state.step === 'success' ? 'Import Complete!' :
        'Import Failed'
      }
      size="lg"
    >
      <div className="space-y-6">
        {state.step === 'upload' && (
          <>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload your tag file
              </h3>
              <div className="text-gray-600">
                <p className="mb-4">Supported formats:</p>
                <ul className="text-left mx-auto max-w-md space-y-2">
                  <li>● Rockwell: .csv (Studio 5000 Tag Database), .l5x (XML)</li>
                  <li>● Siemens: .csv, .xlsx, .xml</li>
                  <li>● Beckhoff: .csv, .xml</li>
                </ul>
                <p className="mt-4 text-sm italic">
                  Tip: Export your tags from your PLC software in one of these formats.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xml,.l5x"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Choose file to upload
                </div>
                <div className="text-gray-600">
                  Click to browse or drag and drop your tag file
                </div>
              </div>
            </div>
          </>
        )}

        {state.step === 'detect' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Analyzing your file...
            </div>
            <div className="text-sm text-gray-600">
              Please wait while we detect the file format.
            </div>
          </div>
        )}

        {state.step === 'manual-select' && (
          <>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                File Format Detection
              </h3>
              <p className="text-gray-600">
                {state.detectedVendors?.length === 0 
                  ? "We couldn't automatically identify your file's format. Please select the vendor and format manually:"
                  : "Multiple possible vendors detected. Please confirm the correct vendor and format:"}
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
                      disabled={state.detectedVendors && state.detectedVendors.length > 0 && !state.detectedVendors.includes(option.vendor)}
                    >
                      <div className="font-medium text-gray-900">
                        {option.displayName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </div>
                      {state.detectedVendors?.includes(option.vendor) && (
                        <div className="text-xs text-green-600 mt-1">
                          Detected in file
                        </div>
                      )}
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
                        disabled={state.detectedFormat && state.detectedFormat !== format}
                      >
                        {format.toUpperCase()}
                        {state.detectedFormat === format && (
                          <div className="text-xs mt-1">
                            Detected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {state.step === 'progress' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Importing your tags...
            </div>
            <div className="text-sm text-gray-600">
              Please wait while your tags are being processed.
            </div>
          </div>
        )}

        {state.step === 'success' && (
          <>
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-900 mb-2">
                Import completed successfully!
              </div>
              <div className="text-gray-600 mb-4">
                {state.importResult?.inserted || 0} tags were imported 
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
                      {state.importResult.errorReport && (
                        <div className="mt-3">
                          <a
                            href={`data:text/csv;base64,${state.importResult.errorReport}`}
                            download="import-errors.csv"
                            className="inline-flex items-center text-sm text-yellow-700 hover:text-yellow-800"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download Error Report
                          </a>
                        </div>
                      )}
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
