import { Tag } from '../components/tags/api';

export interface ImportError {
  row: number;
  errors: string[];
  raw: any;
}

export interface ImportResult {
  success: boolean;
  inserted?: number;
  errors?: ImportError[];
  processed?: number;
}

export const validateImportFile = (file: File, vendor: string, format: string): string | null => {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return 'File size exceeds 10MB limit';
  }

  // Validate file extension and format
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (format) {
    case 'csv':
      if (extension !== 'csv') {
        return 'Invalid file format. Please upload a CSV file.';
      }
      break;
    case 'xlsx':
      if (extension !== 'xlsx' && extension !== 'xls') {
        return 'Invalid file format. Please upload an Excel file (XLSX/XLS).';
      }
      break;
    case 'xml':
    case 'l5x':
      if (extension !== 'xml' && extension !== 'l5x') {
        return 'Invalid file format. Please upload an XML or L5X file.';
      }
      break;
    default:
      return 'Unsupported file format';
  }

  return null;
};

export const getVendorHeaders = (vendor: string): string[] => {
  switch (vendor) {
    case 'rockwell':
      return ['Tag Name', 'Data Type', 'Scope', 'Description', 'External Access', 'Default Value', 'Address'];
    case 'siemens':
      return ['Name', 'Data Type', 'Address', 'Comment', 'Initial Value'];
    case 'beckhoff':
      return ['Name', 'DataType', 'Address', 'Comment', 'InitialValue', 'Scope', 'AccessMode'];
    default:
      return [];
  }
};

export const validateTagRow = (row: any, vendor: string): string[] => {
  const errors: string[] = [];

  // Common validations
  if (!row.name) {
    errors.push('Missing tag name');
  }
  if (!row.data_type) {
    errors.push('Missing data type');
  }

  // Vendor-specific validations
  switch (vendor) {
    case 'rockwell':
      if (!row.address?.match(/^[A-Z]:[0-9]+(\.[0-9]+)?$/)) {
        errors.push('Invalid Rockwell address format');
      }
      break;
    case 'siemens':
      if (!row.address?.match(/^%[IMQ][BWDX]?[0-9]+(\.[0-9]+)?$/)) {
        errors.push('Invalid Siemens address format');
      }
      break;
    case 'beckhoff':
      if (!row.address?.match(/^(%[IQM][BWDL]?[0-9]+(\.[0-9]+)?|[A-Za-z][A-Za-z0-9_]*)$/)) {
        errors.push('Invalid Beckhoff address format');
      }
      break;
  }

  return errors;
};
