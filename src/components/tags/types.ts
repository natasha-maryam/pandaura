// Common types that can be used by all vendors
export type CommonDataType = 'BOOL' | 'INT' | 'DINT' | 'REAL' | 'STRING' | 'DInt';

// Vendor-specific base types
export type VendorType = 'rockwell' | 'siemens' | 'beckhoff';

// Type that allows either common types or any string (for Beckhoff custom types)
export type TagDataType = CommonDataType | string;

export type TagScope = 'global' | 'local' | 'input' | 'output' | 'memory' | 'db';
export type TagType = 'input' | 'output' | 'memory' | 'temp' | 'constant';
