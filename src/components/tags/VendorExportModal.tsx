import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, Loader2, FileDown, X } from 'lucide-react';
import { Modal } from '../ui';
import { TagsAPI, Tag } from './api';

interface VendorExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  tags: Tag[]; // Changed from tagCount to full tags array
}

type Vendor = 'rockwell' | 'siemens' | 'beckhoff';
type Format = 'csv' | 'xlsx' | 'l5x' | 'xml' | 'json';

interface ExportOption {
  vendor: Vendor;
  formats: Format[];
  displayName: string;
}

const exportOptions: ExportOption[] = [
  {
    vendor: 'rockwell',
    formats: ['csv', 'xlsx', 'l5x'],
    displayName: 'Rockwell (Allen-Bradley)'
  },
  {
    vendor: 'siemens',
    formats: ['csv', 'xlsx', 'xml'],
    displayName: 'Siemens (TIA Portal)'
  },
  {
    vendor: 'beckhoff',
    formats: ['csv', 'xlsx', 'xml'],
    displayName: 'Beckhoff (TwinCAT)'
  }
];

type ExportStep = 'select' | 'confirm' | 'progress' | 'success' | 'error';

interface ExportState {
  step: ExportStep;
  selectedVendor?: Vendor;
  selectedFormat?: Format;
  errorMessage?: string;
  downloadUrl?: string;
  filename?: string;
}

export default function VendorExportModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  tags
}: VendorExportModalProps) {
  const [state, setState] = useState<ExportState>({ step: 'select' });

  // Calculate vendor-specific tag counts
  const getVendorTagCount = (vendor: Vendor): number => {
    return tags.filter(tag => tag.vendor === vendor).length;
  };

  // Get total tag count
  const totalTagCount = tags.length;

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
    setState(prev => ({ ...prev, selectedFormat: format }));
  };

  const handleConfirmExport = () => {
    setState(prev => ({ ...prev, step: 'confirm' }));
  };

  const handleStartExport = async () => {
    if (!state.selectedVendor || !state.selectedFormat) return;

    const vendorTagCount = getVendorTagCount(state.selectedVendor);
    
    // Check if vendor has any tags
    if (vendorTagCount === 0) {
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        errorMessage: `No ${state.selectedVendor} tags found in this project. Please import or create ${state.selectedVendor} tags first.`
      }));
      return;
    }

    setState(prev => ({ ...prev, step: 'progress' }));

    try {
      // Show warning for large exports
      if (vendorTagCount > 1000) {
        // For large exports, we could add a brief delay to show the warning
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call the appropriate vendor-specific export API
      let blob: Blob;
      if (state.selectedVendor === 'beckhoff') {
        if (state.selectedFormat === 'csv') {
          blob = await TagsAPI.exportBeckhoffCsv(projectId);
        } else if (state.selectedFormat === 'xml') {
          blob = await TagsAPI.exportBeckhoffXml(projectId);
        } else {
          // For xlsx, default to CSV for now
          blob = await TagsAPI.exportBeckhoffCsv(projectId);
        }
      } else if (state.selectedVendor === 'rockwell') {
        if (state.selectedFormat === 'csv') {
          blob = await TagsAPI.exportRockwellCsv(projectId);
        } else if (state.selectedFormat === 'l5x') {
          blob = await TagsAPI.exportRockwellL5X(projectId);
        } else {
          // For xlsx, default to CSV for now
          blob = await TagsAPI.exportRockwellCsv(projectId);
        }
      } else {
        // For other vendors, use the generic export function
        blob = await TagsAPI.exportVendorTags(projectId, state.selectedVendor, state.selectedFormat);
      }

      // Create download
      const url = window.URL.createObjectURL(blob);
      const filename = `${projectName}-${state.selectedVendor}-tags.${state.selectedFormat}`;
      
      setState(prev => ({ 
        ...prev, 
        step: 'success', 
        downloadUrl: url, 
        filename 
      }));

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

  const handleDownload = () => {
    if (state.downloadUrl && state.filename) {
      const a = document.createElement('a');
      a.href = state.downloadUrl;
      a.download = state.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(state.downloadUrl);
    }
  };

  const handleRetry = () => {
    setState(prev => ({ ...prev, step: 'select' }));
  };

  const handleGoBack = () => {
    setState(prev => ({ ...prev, step: 'select' }));
  };

  const canProceedToConfirm = state.selectedVendor && state.selectedFormat;
  const selectedOption = exportOptions.find(opt => opt.vendor === state.selectedVendor);

  // Check if we have no tags to export
  if (totalTagCount === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Export Tags"
        size="md"
      >
        <div className="flex flex-col items-center py-8 text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tags to Export</h3>
          <p className="text-gray-600 mb-6">
            Please generate or import tags before exporting.
          </p>
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        state.step === 'select' ? 'Export Your Tags' :
        state.step === 'confirm' ? 'Confirm Export' :
        state.step === 'progress' ? 'Exporting Tags' :
        state.step === 'success' ? 'Export Complete!' :
        'Export Failed'
      }
      size="md"
    >
      <div className="space-y-6">
        {/* Step 1: Select Export Format */}
        {state.step === 'select' && (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Choose your export vendor and format:
            </div>
            
            {/* Vendor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vendor
              </label>
              <div className="grid grid-cols-1 gap-2">
                {exportOptions.map((option) => {
                  const vendorTagCount = getVendorTagCount(option.vendor);
                  return (
                    <div
                      key={option.vendor}
                      onClick={() => handleVendorSelect(option.vendor)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        state.selectedVendor === option.vendor
                          ? 'border-primary bg-primary/5'
                          : vendorTagCount === 0
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ pointerEvents: vendorTagCount === 0 ? 'none' : 'auto' }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{option.displayName}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Formats: {option.formats.map(f => f.toUpperCase()).join(', ')}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          vendorTagCount === 0 ? 'text-gray-400' : 'text-blue-600'
                        }`}>
                          {vendorTagCount} tags
                        </div>
                      </div>
                      {vendorTagCount === 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          No tags available for this vendor
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Format Selection */}
            {state.selectedVendor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOption?.formats.map((format) => (
                    <div
                      key={format}
                      onClick={() => handleFormatSelect(format)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors text-center ${
                        state.selectedFormat === format
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{format.toUpperCase()}</div>
                      {format === 'l5x' && (
                        <div className="text-xs text-gray-500 mt-1">Rockwell Studio 5000 format</div>
                      )}
                      {format === 'xml' && state.selectedVendor === 'siemens' && (
                        <div className="text-xs text-gray-500 mt-1">TIA Portal XML</div>
                      )}
                      {format === 'xml' && state.selectedVendor === 'beckhoff' && (
                        <div className="text-xs text-gray-500 mt-1">TwinCAT XML</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Tip:</strong> Select the format compatible with your PLC programming environment.
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={!canProceedToConfirm}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2: Confirmation */}
        {state.step === 'confirm' && (
          <>
            <div className="text-center py-4">
              <div className="text-lg font-medium text-gray-900 mb-4">
                You are about to export {getVendorTagCount(state.selectedVendor!)} {selectedOption?.displayName} tags for project '{projectName}' in {state.selectedFormat?.toUpperCase()} format.
              </div>
              <div className="text-sm text-gray-600">
                Click Export to start.
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
                onClick={handleStartExport}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </>
        )}

        {/* Step 3: Export in Progress */}
        {state.step === 'progress' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Preparing your export file...
            </div>
            <div className="text-sm text-gray-600">
              Please do not close this window.
            </div>
          </div>
        )}

        {/* Step 4: Export Success */}
        {state.step === 'success' && (
          <>
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-900 mb-2">
                Export complete!
              </div>
              <div className="text-gray-600 mb-6">
                Your file {state.filename} is ready to download.
              </div>
              <button
                onClick={handleDownload}
                className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2 mx-auto"
              >
                <FileDown className="w-5 h-5" />
                Download Now
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* Step 5: Export Error */}
        {state.step === 'error' && (
          <>
            <div className="text-center py-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-900 mb-2">
                Export failed.
              </div>
              <div className="text-gray-600 mb-2">
                <strong>Reason:</strong> {state.errorMessage}
              </div>
              <div className="text-sm text-gray-500 mb-6">
                Please try again or contact support if the problem persists.
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
