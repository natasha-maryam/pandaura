/**
 * Utility functions to convert database tags back to ST (Structured Text) format
 */

export interface Tag {
  id?: number;
  name: string;
  type?: string;
  data_type?: string;
  address?: string;
  description?: string;
  default_value?: string;
  vendor?: string;
  scope?: string;
}

/**
 * Convert a single tag to ST variable declaration format
 */
export function tagToSTDeclaration(tag: Tag): string {
  const dataType = tag.data_type || tag.type || 'BOOL';
  // Don't include address comments to prevent auto-sync issues
  const description = tag.description ? ` // ${tag.description}` : '';
  const defaultValue = tag.default_value ? ` := ${tag.default_value}` : '';
  
  return `  ${tag.name} : ${dataType}${defaultValue};${description}`;
}

/**
 * Convert a single tag to ST variable declaration format with full details (including address)
 * Use this for export/documentation purposes only
 */
export function tagToSTDeclarationWithAddress(tag: Tag): string {
  const dataType = tag.data_type || tag.type || 'BOOL';
  const address = tag.address ? ` // address=${tag.address}` : '';
  const description = tag.description ? ` ${tag.description}` : '';
  const defaultValue = tag.default_value ? ` := ${tag.default_value}` : '';
  
  return `  ${tag.name} : ${dataType}${defaultValue};${address}${description}`;
}

/**
 * Convert an array of tags to complete ST VAR block
 */
export function tagsToSTCode(tags: Tag[]): string {
  if (tags.length === 0) {
    return `VAR
    // Add your variables here
END_VAR`;
  }

  const declarations = tags
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
    .map(tag => tagToSTDeclaration(tag))
    .join('\n');

  return `VAR
${declarations}
END_VAR`;
}

/**
 * Group tags by scope and generate complete PROGRAM structure
 */
export function tagsToSTCodeWithScopes(tags: Tag[]): string {
  if (tags.length === 0) {
    return `PROGRAM Main
    VAR
        // Add your variables here
    END_VAR

    // Add your logic here

END_PROGRAM`;
  }

  // Group tags by scope
  const tagsByScope = tags.reduce((groups, tag) => {
    const scope = tag.scope || 'Local';
    if (!groups[scope]) {
      groups[scope] = [];
    }
    groups[scope].push(tag);
    return groups;
  }, {} as Record<string, Tag[]>);

  // Generate VAR blocks for each scope
  const varBlocks = Object.entries(tagsByScope).map(([scope, scopeTags]) => {
    const scopeLabel = scope === 'Local' ? 'VAR' : `VAR_${scope.toUpperCase()}`;
    const declarations = scopeTags
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(tag => tagToSTDeclaration(tag))
      .join('\n');

    return `    ${scopeLabel}
${declarations}
    END_VAR`;
  });

  const varSection = varBlocks.join('\n\n');

  return `PROGRAM Main
${varSection}

    // Add your logic here

END_PROGRAM`;
}

/**
 * Extract vendor-specific formatting for addresses
 */
export function formatAddressForVendor(address: string, vendor: string): string {
  if (!address) return '';
  
  switch (vendor?.toLowerCase()) {
    case 'rockwell':
      // Rockwell format: %I:0.0, %O:0.0, %M:0.0
      return address.startsWith('%') ? address : `%${address}`;
    
    case 'siemens':
      // Siemens format: I0.0, Q0.0, M0.0
      return address.replace('%', '');
    
    case 'beckhoff':
      // Beckhoff format: AT %I*, AT %Q*, AT %M*
      return address.startsWith('AT %') ? address : `AT %${address}`;
    
    default:
      return address;
  }
}
