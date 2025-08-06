'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Eye, 
  X
} from 'lucide-react';

interface PDFCatalog {
  id: string;
  title: string;
  pdfUrl?: string;
  localPdfPath?: string;
  fileSize?: number;
  thumbnailUrl?: string;
}

interface PDFCatalogViewerProps {
  catalogs: PDFCatalog[];
  productTitle: string;
  className?: string;
}

// Format file size for display
const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown size';
  
  const kb = bytes / 1024;
  const mb = kb / 1024;
  
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  } else if (kb >= 1) {
    return `${kb.toFixed(0)} KB`;
  } else {
    return `${bytes} bytes`;
  }
};

// Get PDF URL (prioritize local over external)
const getPdfUrl = (catalog: PDFCatalog) => {
  return catalog.localPdfPath || catalog.pdfUrl;
};

const PDFCatalogViewer: React.FC<PDFCatalogViewerProps> = ({
  catalogs,
  productTitle,
  className = '',
}) => {
  const [selectedCatalog, setSelectedCatalog] = useState<PDFCatalog | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out catalogs without PDF URLs
  const availableCatalogs = catalogs.filter(catalog => getPdfUrl(catalog));

  const openViewer = async (catalog: PDFCatalog) => {
    setSelectedCatalog(catalog);
    setIsViewerOpen(true);
    setIsLoading(true);
    setError(null);

    // Simulate loading delay (in real implementation, this would handle PDF loading)
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setSelectedCatalog(null);
    setError(null);
  };

  const downloadPDF = (catalog: PDFCatalog) => {
    const pdfUrl = getPdfUrl(catalog);
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${productTitle.replace(/\s+/g, '_')}_${catalog.title.replace(/\s+/g, '_')}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openInNewTab = (catalog: PDFCatalog) => {
    const pdfUrl = getPdfUrl(catalog);
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (availableCatalogs.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No PDF Catalogs Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Technical documentation is not available for this product.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">PDF Catalogs & Documentation</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {availableCatalogs.length} {availableCatalogs.length === 1 ? 'Document' : 'Documents'}
          </span>
        </div>
      </div>

      {/* PDF Catalog List */}
      <div className="p-6">
        <div className="space-y-4">
          {availableCatalogs.map((catalog) => (
            <div
              key={catalog.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {/* PDF Thumbnail or Icon */}
                <div className="flex-shrink-0">
                  {catalog.thumbnailUrl ? (
                    <div className="w-12 h-16 relative rounded border overflow-hidden">
                      <img
                        src={catalog.thumbnailUrl}
                        alt={`${catalog.title} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-16 bg-red-100 rounded border flex items-center justify-center">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                  )}
                </div>

                {/* PDF Information */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {catalog.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Technical Specifications
                    {catalog.fileSize && (
                      <span className="ml-2">• {formatFileSize(catalog.fileSize)}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openViewer(catalog)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => downloadPDF(catalog)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={() => openInNewTab(catalog)}
                  className="inline-flex items-center p-2 border border-gray-300 shadow-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isViewerOpen && selectedCatalog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedCatalog.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{productTitle}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadPDF(selectedCatalog)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => openInNewTab(selectedCatalog)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    New Tab
                  </button>
                  <button
                    onClick={closeViewer}
                    className="inline-flex items-center p-2 border border-gray-300 shadow-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 bg-gray-100 relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading PDF</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                    <div className="mt-6 space-x-3">
                      <button
                        onClick={() => openInNewTab(selectedCatalog)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Open in New Tab
                      </button>
                      <button
                        onClick={() => downloadPDF(selectedCatalog)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full">
                  {/* PDF Embed - In a real implementation, this would use PDF.js or similar */}
                  <iframe
                    src={getPdfUrl(selectedCatalog)}
                    className="w-full h-full border-none"
                    title={selectedCatalog.title}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setError('Failed to load PDF. Please try downloading or opening in a new tab.');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFCatalogViewer;