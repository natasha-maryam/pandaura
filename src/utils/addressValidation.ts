// Address validation utilities for different PLC vendors
// Supports Rockwell, Siemens, and Beckhoff address formats

export interface AddressValidationResult {
  isValid: boolean;
  errorMessage?: string;
  suggestedFormats?: string[];
}

// Rockwell (Allen-Bradley) address patterns
const ROCKWELL_PATTERNS = [
  { pattern: /^I:\d+\/\d+$/i, description: "Input: I:x/y (e.g., I:1/0)" },
  { pattern: /^O:\d+\/\d+$/i, description: "Output: O:x/y (e.g., O:2/0)" },
  { pattern: /^N\d+:\d+$/i, description: "Integer: Nx:y (e.g., N7:0)" },
  { pattern: /^F\d+:\d+$/i, description: "Float: Fx:y (e.g., F8:0)" },
  { pattern: /^B\d+:\d+$/i, description: "Binary: Bx:y (e.g., B3:0)" },
  { pattern: /^T\d+:\d+$/i, description: "Timer: Tx:y (e.g., T4:0)" },
  { pattern: /^C\d+:\d+$/i, description: "Counter: Cx:y (e.g., C5:0)" },
  { pattern: /^R\d+:\d+$/i, description: "Control: Rx:y (e.g., R6:0)" },
  { pattern: /^S\d+:\d+$/i, description: "String: Sx:y (e.g., S2:0)" },
  { pattern: /^[A-Za-z_][A-Za-z0-9_]*$/i, description: "Symbolic: MyTag_1" }
];

// Siemens address patterns
const SIEMENS_PATTERNS = [
  { pattern: /^I\d+\.\d+$/i, description: "Input: Ix.y (e.g., I0.0)" },
  { pattern: /^Q\d+\.\d+$/i, description: "Output: Qx.y (e.g., Q0.0)" },
  { pattern: /^M\d+\.\d+$/i, description: "Memory: Mx.y (e.g., M0.0)" },
  { pattern: /^DB\d+\.DB[BWDX]\d+$/i, description: "Data Block: DBx.DBYz (e.g., DB1.DBD0)" },
  { pattern: /^L\d+\.\d+$/i, description: "Local: Lx.y (e.g., L0.0)" },
  { pattern: /^[A-Za-z_][A-Za-z0-9_]*$/i, description: "Symbolic: MyTag_1" }
];

// Beckhoff address patterns
const BECKHOFF_PATTERNS = [
  { pattern: /^%[IQMT]\d+(\.\d+)?$/i, description: "I/O: %Xx.y (e.g., %I0.0, %Q2)" },
  { pattern: /^%[IQMT][BWDL]\d+$/i, description: "Typed Memory: %XYz (e.g., %MW100)" },
  { pattern: /^GVL\.[a-zA-Z_][\w]*$/i, description: "GVL Reference: GVL.Variable" },
  { pattern: /^[a-zA-Z_][\w]*$/i, description: "Symbolic: MyVariable" }
];

export function validateAddress(address: string, vendor: string): AddressValidationResult {
  if (!address || !address.trim()) {
    return {
      isValid: false,
      errorMessage: "Address is required"
    };
  }

  const trimmedAddress = address.trim();
  let patterns: Array<{ pattern: RegExp; description: string }> = [];
  let vendorName = "";

  switch (vendor.toLowerCase()) {
    case 'rockwell':
      patterns = ROCKWELL_PATTERNS;
      vendorName = "Rockwell";
      break;
    case 'siemens':
      patterns = SIEMENS_PATTERNS;
      vendorName = "Siemens";
      break;
    case 'beckhoff':
      patterns = BECKHOFF_PATTERNS;
      vendorName = "Beckhoff";
      break;
    default:
      return {
        isValid: false,
        errorMessage: "Unsupported vendor"
      };
  }

  const isValid = patterns.some(({ pattern }) => pattern.test(trimmedAddress));

  if (isValid) {
    return { isValid: true };
  }

  return {
    isValid: false,
    errorMessage: `Invalid ${vendorName} address format: ${address}`,
    suggestedFormats: patterns.map(p => p.description)
  };
}

export function getAddressExamples(vendor: string): string[] {
  switch (vendor.toLowerCase()) {
    case 'rockwell':
      return ['I:1/0', 'O:2/0', 'N7:0', 'F8:0', 'MyTag_1'];
    case 'siemens':
      return ['I0.0', 'Q0.0', 'M0.0', 'DB1.DBD0', 'MyTag_1'];
    case 'beckhoff':
      return ['%I0.0', '%Q2.1', '%MW100', 'GVL.MyVar', 'MyVariable'];
    default:
      return [];
  }
}

export function getVendorAddressDescription(vendor: string): string {
  switch (vendor.toLowerCase()) {
    case 'rockwell':
      return "Rockwell Allen-Bradley addressing: I:x/y, O:x/y, Nx:y, Fx:y, or symbolic names";
    case 'siemens':
      return "Siemens TIA Portal addressing: Ix.y, Qx.y, Mx.y, DBx.DBYz, or symbolic names";
    case 'beckhoff':
      return "Beckhoff TwinCAT addressing: %Xx.y, %XYz, GVL.Variable, or symbolic names";
    default:
      return "Please select a vendor to see address format guidelines";
  }
}
