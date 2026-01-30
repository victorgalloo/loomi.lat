"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PortalButton from "./PortalButton";

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
}

export default function FileViewer({
  isOpen,
  onClose,
  fileName,
  fileUrl,
}: FileViewerProps) {
  const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = fileName.match(/\.(pdf)$/i);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-4">
                {fileName}
              </h2>
              <div className="flex items-center gap-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar
                </a>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-hidden">
              {isImage ? (
                <div className="w-full h-full flex items-center justify-center p-8 bg-gray-50">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-full min-h-[600px]"
                  title={fileName}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">{fileName}</p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PortalButton variant="primary">
                        Descargar archivo
                      </PortalButton>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


