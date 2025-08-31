import { TableArtifact } from '../types/ai';

/**
 * Parse markdown tables from text content and convert them to TableArtifact objects
 */
export function parseMarkdownTables(content: string): TableArtifact[] {
  const tables: TableArtifact[] = [];
  
  // Regex to match markdown tables
  const tableRegex = /\|(.+)\|\s*\n\|(\s*[-:]+\s*\|.*)\|\s*\n((?:\|.*\|\s*\n?)*)/gm;
  
  let match;
  let tableIndex = 0;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const [fullMatch, headerRow, separatorRow, dataRows] = match;
    
    // Parse header
    const headers = headerRow
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    
    // Parse data rows
    const rows: string[][] = [];
    if (dataRows.trim()) {
      const rowLines = dataRows.trim().split('\n');
      for (const line of rowLines) {
        if (line.trim() && line.includes('|')) {
          const cells = line
            .split('|')
            .map(cell => cell.trim())
            .filter((cell, index, arr) => index > 0 && index < arr.length - 1); // Remove empty cells at start/end
          
          if (cells.length > 0) {
            rows.push(cells);
          }
        }
      }
    }
    
    // Only create table if we have headers and at least one row
    if (headers.length > 0 && rows.length > 0) {
      tables.push({
        title: `Extracted Table ${tableIndex + 1}`,
        schema: headers,
        rows: rows
      });
      tableIndex++;
    }
  }
  
  return tables;
}

/**
 * Remove markdown tables from content to avoid duplication
 */
export function removeMarkdownTables(content: string): string {
  const tableRegex = /\|(.+)\|\s*\n\|(\s*[-:]+\s*\|.*)\|\s*\n((?:\|.*\|\s*\n?)*)/gm;
  return content.replace(tableRegex, '').trim();
}

/**
 * Parse citations from content
 */
export function parseCitations(content: string): string[] {
  const citations: string[] = [];
  
  // Look for "Citations:" section
  const citationMatch = content.match(/Citations:\s*(.*?)(?:\n\n|$)/s);
  if (citationMatch) {
    const citationText = citationMatch[1].trim();
    // Split by common citation separators
    const citationItems = citationText.split(/[,;]/).map(c => c.trim()).filter(c => c.length > 0);
    citations.push(...citationItems);
  }
  
  return citations;
}

/**
 * Remove citations section from content
 */
export function removeCitations(content: string): string {
  return content.replace(/Citations:\s*(.*?)(?=\n\n|\n?$)/s, '').trim();
}

/**
 * Parse processed files information
 */
export function parseProcessedFiles(content: string): Array<{filename: string; type: string; size: number}> {
  const files: Array<{filename: string; type: string; size: number}> = [];
  
  // Look for "Processed Files" section
  const processedFilesMatch = content.match(/Processed Files\s*(.*?)(?:\n\n|$)/s);
  if (processedFilesMatch) {
    const filesText = processedFilesMatch[1];
    // Parse file info like "filename.pdf(125.9 KB) application/pdf"
    const fileMatches = filesText.matchAll(/([^\s\(]+)\(([^)]+)\)\s*([^\s]+)/g);
    for (const match of fileMatches) {
      const [, filename, sizeStr, type] = match;
      const size = parseFloat(sizeStr.replace(/[^\d.]/g, ''));
      files.push({ filename, type, size });
    }
  }
  
  return files;
}

/**
 * Remove processed files section from content
 */
export function removeProcessedFiles(content: string): string {
  return content.replace(/Processed Files\s*(.*?)(?=\n\n|\n?$)/s, '').trim();
}
