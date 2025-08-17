// Vendor-specific validation utilities for tags

export type Vendor = 'rockwell' | 'siemens' | 'beckhoff';
export type TagType = 'BOOL' | 'INT' | 'DINT' | 'REAL' | 'STRING';

// Vendor-specific supported data types
export const vendorSupportedTypes: Record<Vendor, TagType[]> = {
  rockwell: ['BOOL', 'INT', 'DINT', 'REAL', 'STRING'],
  siemens: ['BOOL', 'INT', 'DINT', 'REAL', 'STRING'], // Siemens doesn't support TIMER/COUNTER
  beckhoff: ['BOOL', 'INT', 'DINT', 'REAL', 'STRING']
};

// Validate if a data type is supported by a vendor
export const validateTagTypeForVendor = (tagType: TagType, vendor: Vendor): boolean => {
  const supportedTypes = vendorSupportedTypes[vendor];
  return supportedTypes.includes(tagType);
};

// Get available tag types for selected vendor
export const getAvailableTagTypes = (vendor: Vendor): TagType[] => {
  return vendorSupportedTypes[vendor] || vendorSupportedTypes.rockwell;
};

// Validate address format for vendor (basic patterns)
export const validateAddressForVendor = (address: string, vendor: Vendor): boolean => {
  if (!address || !address.trim()) return false;
  
  switch (vendor) {
    case 'rockwell':
      // Rockwell patterns: N7:0, B3:0/1, T4:0, C5:0, F8:0
      return /^([NBFTC]\d+:\d+|[NBFTC]\d+:\d+\/\d+)$/i.test(address);
    
    case 'siemens':
      // Siemens patterns: M10.0, MW20, DB1.DBX0.0, I0.0, Q0.0
      return /^(M\d+\.\d+|MW\d+|DB\d+\.DB[XWD]\d+(\.\d+)?|[IQ]\d+\.\d+)$/i.test(address);
    
    case 'beckhoff':
      // Beckhoff patterns: %IX1.0, %QX2.1, %MW10
      return /^%(I|Q)[XWD]\d+\.\d+$|^%MW\d+$/i.test(address);
    
    default:
      return true; // Default to valid for unknown vendors
  }
};

// Get vendor-specific error message for invalid data type
export const getInvalidTypeMessage = (tagType: TagType, vendor: Vendor): string => {
  return `Data type '${tagType}' is not supported by ${vendor.charAt(0).toUpperCase() + vendor.slice(1)} vendor. Supported types: ${vendorSupportedTypes[vendor].join(', ')}`;
};

// Get vendor-specific error message for invalid address
export const getInvalidAddressMessage = (address: string, vendor: Vendor): string => {
  const examples: Record<Vendor, string> = {
    rockwell: 'N7:0, B3:0/1, T4:0',
    siemens: 'M10.0, MW20, DB1.DBX0.0',
    beckhoff: '%IX1.0, %QX2.1, %MW10'
  };
  
  return `Address format '${address}' is invalid for ${vendor.charAt(0).toUpperCase() + vendor.slice(1)} vendor. Examples: ${examples[vendor]}`;
};
