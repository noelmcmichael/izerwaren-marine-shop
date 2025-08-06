'use client';

import { FileText, Download, ExternalLink, Maximize, X, AlertCircle, Loader } from 'lucide-react';
import React, { useState } from 'react';

interface PDFPreviewProps {
  pdfUrl: string;
  productTitle: string;
  fileSize?: number;
  className?: string;
}

export default function PDFPreview({
  pdfUrl,
  productTitle,
  fileSize,
  className = '',
}: PDFPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Format file size for display
  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown size';

    const units = ['B', 'KB', 'MB', 'GB'];
    let sizeValue = size;
    let unitIndex = 0;

    while (sizeValue >= 1024 && unitIndex < units.length - 1) {
      sizeValue /= 1024;
      unitIndex++;
    }

    return `${sizeValue.toFixed(1)} ${units[unitIndex]}`;
  };

  const handlePreviewClick = () => {
    setShowPreview(!showPreview);
    if (!showPreview) {
      setIsLoading(true);
      setHasError(false);
    }
  };

  const handlePreviewLoad = () => {
    setIsLoading(false);
  };

  const handlePreviewError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <>
      {/* PDF Info Card */}
      <div className={`${className} border border-gray-200 rounded-lg overflow-hidden`}>
        <div className='p-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center'>
              <FileText className='h-8 w-8 text-red-600 mr-3 flex-shrink-0' />
              <div>
                <h4 className='text-sm font-medium text-gray-900'>Product Specification Sheet</h4>
                <p className='text-xs text-gray-500 mt-1'>
                  PDF Document • {formatFileSize(fileSize)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='mt-4 flex flex-wrap gap-2'>
            <button
              onClick={handlePreviewClick}
              className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              {showPreview ? (
                <>
                  <X className='h-4 w-4 mr-2' />
                  Hide Preview
                </>
              ) : (
                <>
                  <Maximize className='h-4 w-4 mr-2' />
                  Show Preview
                </>
              )}
            </button>

            <a
              href={pdfUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <ExternalLink className='h-4 w-4 mr-2' />
              Open
            </a>

            <a
              href={pdfUrl}
              download
              className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <Download className='h-4 w-4 mr-2' />
              Download
            </a>
          </div>
        </div>

        {/* Inline Preview (collapsed by default) */}
        {showPreview && (
          <div className='border-t border-gray-200'>
            <div className='p-4 bg-gray-50'>
              <div className='flex items-center justify-between mb-4'>
                <h5 className='text-sm font-medium text-gray-900'>Document Preview</h5>
                <button
                  onClick={handleClosePreview}
                  className='p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              <div className='relative bg-white rounded-lg border border-gray-300 overflow-hidden'>
                {isLoading && (
                  <div className='absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10'>
                    <div className='flex items-center'>
                      <Loader className='h-5 w-5 animate-spin text-blue-600 mr-2' />
                      <span className='text-sm text-gray-600'>Loading document...</span>
                    </div>
                  </div>
                )}

                {hasError ? (
                  <div className='p-8 text-center'>
                    <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
                    <h6 className='text-sm font-medium text-gray-900 mb-2'>Preview Unavailable</h6>
                    <p className='text-sm text-gray-500 mb-4'>
                      Unable to load PDF preview. Your browser may not support inline PDF viewing.
                    </p>
                    <div className='flex justify-center space-x-2'>
                      <a
                        href={pdfUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                      >
                        <ExternalLink className='h-4 w-4 mr-2' />
                        Open in New Tab
                      </a>
                      <a
                        href={pdfUrl}
                        download
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                      >
                        <Download className='h-4 w-4 mr-2' />
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`${pdfUrl}#view=FitH`}
                    className='w-full h-96'
                    title={`${productTitle} Specification Sheet`}
                    onLoad={handlePreviewLoad}
                    onError={handlePreviewError}
                    style={{ minHeight: '400px' }}
                  />
                )}
              </div>

              {/* PDF Controls/Info */}
              {!hasError && (
                <div className='mt-3 text-xs text-gray-500 text-center'>
                  <p>
                    Preview may not show all features. For best experience, download or open in a
                    new tab.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
