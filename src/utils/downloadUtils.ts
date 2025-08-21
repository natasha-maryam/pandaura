/**
 * Utility functions for handling file downloads
 */

/**
 * Extract filename from Content-Disposition header
 * @param response - The fetch response object
 * @returns The filename extracted from the header, or a default name
 */
export function getFilenameFromResponse(response: Response): string {
  const contentDisposition = response.headers.get('Content-Disposition');
  
  if (contentDisposition) {
    // Look for filename="..." pattern
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      return filenameMatch[1];
    }
    
    // Look for filename=... pattern (without quotes)
    const filenameMatch2 = contentDisposition.match(/filename=([^;]+)/);
    if (filenameMatch2) {
      return filenameMatch2[1].trim();
    }
  }
  
  // Fallback to default filename
  return 'export.csv';
}

/**
 * Download a blob with the specified filename
 * @param blob - The blob to download
 * @param filename - The filename to use for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Result type for API calls that return downloadable files
 */
export interface DownloadResult {
  blob: Blob;
  filename: string;
}
