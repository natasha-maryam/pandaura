// Vendor-specific data type and scope configurations
export type VendorType = 'rockwell' | 'siemens' | 'beckhoff';

export interface VendorTypeConfig {
  name: string;
  dataTypes: string[];
  scopes: string[];
  description?: string;
  allowCustomTypes: boolean;
}

export const vendorConfigs: Record<VendorType, VendorTypeConfig> = {
  rockwell: {
    name: "Rockwell (Allen-Bradley)",
    dataTypes: ["BOOL", "INT", "DINT", "REAL", "STRING"],
    scopes: ["Local", "Global", "Input", "Output"],
    description: "Studio 5000 Compatible Data Types",
    allowCustomTypes: false
  },
  siemens: {
    name: "Siemens",
    dataTypes: ["BOOL", "INT", "DINT", "REAL", "STRING"],
    scopes: [ "Input", "Output", "Memory"],
    description: "TIA Portal Compatible Data Types",
    allowCustomTypes: false
  },
  beckhoff: {
    name: "Beckhoff",
    dataTypes: ["BOOL", "INT", "DINT", "REAL", "STRING"],
    scopes: ["Input", "Output", "Internal", "Global", "Local"],
    description: "TwinCAT Compatible Data Types + Custom Types",
    allowCustomTypes: true
  },
};

export const getVendorDataTypes = (vendor: VendorType): string[] => {
  return vendorConfigs[vendor]?.dataTypes || [];
};

export const getVendorScopes = (vendor: VendorType): string[] => {
  return vendorConfigs[vendor]?.scopes || [];
};

export const isValidDataType = (vendor: VendorType, dataType: string): boolean => {
  // For Beckhoff, all types are valid as long as they're not empty
  if (vendor === 'beckhoff') {
    return dataType.trim().length > 0;
  }
  
  // For other vendors, check against the predefined list
  const validTypes = getVendorDataTypes(vendor);
  return validTypes.includes(dataType);
};

export const isValidScope = (vendor: VendorType, scope: string): boolean => {
  const validScopes = getVendorScopes(vendor);
  return validScopes.includes(scope);
};
