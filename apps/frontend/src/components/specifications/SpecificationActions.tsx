'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownTrayIcon,
  PrinterIcon,
  ShareIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

import type { SpecificationActionsProps } from './types';

/**
 * Export (PDF/CSV), print, and share functionality for specifications
 * Part of Task 10 - Technical Specifications Display System
 */
export function SpecificationActions({
  specifications,
  onExport,
  onPrint,
  onShare,
  disabled = false,
  className = ''
}: SpecificationActionsProps) {
  
  const [isExporting, setIsExporting] = useState<'pdf' | 'csv' | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Handle export with loading state
  const handleExport = async (format: 'pdf' | 'csv') => {
    if (disabled) return;
    
    setIsExporting(format);
    try {
      await onExport(format);
    } catch (error) {
      console.error(`Export failed:`, error);
    } finally {
      setIsExporting(null);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (disabled) return;
    onPrint();
  };

  // Handle share (copy specifications to clipboard as text)
  const handleShare = async () => {
    if (disabled) return;

    if (onShare) {
      onShare();
      return;
    }

    // Default share implementation - copy to clipboard
    try {
      const specText = specifications
        .map(spec => `${spec.name}: ${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`)
        .join('\n');
      
      await navigator.clipboard.writeText(specText);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle copy specifications as JSON
  const handleCopyJSON = async () => {
    if (disabled) return;

    try {
      const jsonData = JSON.stringify(specifications, null, 2);
      await navigator.clipboard.writeText(jsonData);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy JSON to clipboard:', error);
    }
  };

  const specCount = specifications.length;

  return (
    <div className={`specification-actions ${className}`}>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        
        {/* Left Side - Info */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{specCount.toLocaleString()}</span>
            <span> specifications ready for export</span>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Export as PDF */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={disabled || isExporting === 'pdf'}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              disabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
            }`}
            title="Export as PDF document"
          >
            {isExporting === 'pdf' ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </motion.div>
            ) : (
              <DocumentTextIcon className="w-4 h-4 mr-2" />
            )}
            PDF
          </button>

          {/* Export as CSV */}
          <button
            onClick={() => handleExport('csv')}
            disabled={disabled || isExporting === 'csv'}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              disabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
            title="Export as CSV spreadsheet"
          >
            {isExporting === 'csv' ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </motion.div>
            ) : (
              <TableCellsIcon className="w-4 h-4 mr-2" />
            )}
            CSV
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            disabled={disabled}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              disabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
            title="Print specifications"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </button>

          {/* Dropdown for more actions */}
          <div className="relative">
            <details className="group">
              <summary className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                disabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
              }`}>
                <ShareIcon className="w-4 h-4 mr-1" />
                More
              </summary>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10 group-open:block hidden">
                <div className="py-2">
                  
                  {/* Share/Copy Text */}
                  <button
                    onClick={handleShare}
                    disabled={disabled}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {showCopySuccess ? (
                      <>
                        <CheckIcon className="w-4 h-4 mr-3 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4 mr-3" />
                        Copy as Text
                      </>
                    )}
                  </button>

                  {/* Copy as JSON */}
                  <button
                    onClick={handleCopyJSON}
                    disabled={disabled}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-3" />
                    Copy as JSON
                  </button>

                  {/* Divider */}
                  <hr className="my-1 border-gray-200" />

                  {/* Custom Share Action */}
                  {onShare && (
                    <button
                      onClick={onShare}
                      disabled={disabled}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                      <ShareIcon className="w-4 h-4 mr-3" />
                      Share Specifications
                    </button>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Export Status */}
      {isExporting && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 mr-3"
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-blue-600" />
            </motion.div>
            <div className="text-sm text-blue-800">
              Preparing {isExporting.toUpperCase()} export for {specCount} specifications...
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {showCopySuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center">
            <CheckIcon className="w-5 h-5 mr-3 text-green-600" />
            <div className="text-sm text-green-800">
              Specifications copied to clipboard successfully!
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}