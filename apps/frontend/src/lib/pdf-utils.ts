/**
 * PDF utilities for handling product PDFs from different sources
 */

export interface ProductPdf {
  id: string;
  pdfUrl?: string;      // External URL (fallback)
  localPdfPath?: string; // Local path (preferred)
  fileSize?: number;
}

/**
 * Get the best available PDF URL for a product PDF
 * Prioritizes local paths over external URLs
 */
export function getPdfUrl(pdf: ProductPdf): string {
  // Priority: localPdfPath (converted to web path) > pdfUrl > fallback
  if (pdf.localPdfPath) {
    // Convert absolute path to relative web path
    const filename = pdf.localPdfPath.split('/').pop();
    return `/pdfs/${filename}`;
  }
  
  if (pdf.pdfUrl) {
    return pdf.pdfUrl;
  }
  
  // No PDF available
  return '';
}

/**
 * Check if a PDF path is a local path
 */
export function isLocalPdf(pdfPath: string): boolean {
  return pdfPath.startsWith('/') || pdfPath.startsWith('./');
}

/**
 * Format PDF file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  
  return `${size} ${sizes[i]}`;
}

/**
 * Transform API PDF response to frontend format
 */
export function transformApiPdf(apiPdf: any): ProductPdf | null {
  if (!apiPdf) return null;
  
  return {
    id: apiPdf.id,
    pdfUrl: apiPdf.pdfUrl,
    localPdfPath: apiPdf.localPdfPath,
    fileSize: apiPdf.fileSize,
  };
}