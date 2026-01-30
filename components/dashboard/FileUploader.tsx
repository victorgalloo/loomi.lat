"use client";

import { useState, useRef, DragEvent } from "react";
import { useClients } from "@/hooks/useClients";

interface FileUploaderProps {
  clientId: string;
  onUploadSuccess?: (filePath: string, fileUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUploader({
  clientId,
  onUploadSuccess,
  onUploadError,
}: FileUploaderProps) {
  const { uploadFile } = useClients();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const handleFile = async (file: File) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      onUploadError?.(
        "Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, GIF, WebP) y PDFs."
      );
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      onUploadError?.("El archivo es muy grande. Tamaño máximo: 50MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadFile(clientId, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        onUploadError?.(result.error);
      } else if (result.data) {
        onUploadSuccess?.(result.data.path, result.data.fullPath);
        // Reset after success
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      }
    } catch (error: any) {
      onUploadError?.(error.message || "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]); // Only handle first file
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploading ? triggerFileInput : undefined}
        className={`
          relative w-full p-8 rounded-lg border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragging ? "border-opacity-100" : "border-opacity-50"}
          ${uploading ? "cursor-not-allowed opacity-50" : "hover:opacity-80"}
        `}
        style={{
          borderColor: isDragging ? `var(--accent)` : `var(--border)`,
          backgroundColor: isDragging
            ? "rgba(115, 115, 115, 0.05)"
            : `var(--card-bg)`,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          disabled={uploading}
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <>
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <svg
                    className="animate-spin h-16 w-16"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      style={{ color: `var(--accent)` }}
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      style={{ color: `var(--accent)` }}
                    ></path>
                  </svg>
                </div>
              </div>
              <p
                className="text-lg font-medium mb-2 transition-colors duration-300"
                style={{ color: `var(--foreground)` }}
              >
                Subiendo archivo...
              </p>
              <div className="w-full max-w-xs mx-auto">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: `var(--card-bg)` }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: `var(--accent)`,
                    }}
                  ></div>
                </div>
                <p
                  className="text-sm mt-2 transition-colors duration-300"
                  style={{ color: `var(--muted-foreground)` }}
                >
                  {uploadProgress}%
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: `var(--accent)` }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p
                className="text-lg font-medium mb-2 transition-colors duration-300"
                style={{ color: `var(--foreground)` }}
              >
                Arrastra y suelta un archivo aquí
              </p>
              <p
                className="text-sm mb-4 transition-colors duration-300"
                style={{ color: `var(--muted-foreground)` }}
              >
                o haz clic para seleccionar
              </p>
              <p
                className="text-xs transition-colors duration-300"
                style={{ color: `var(--subtitle)` }}
              >
                Imágenes (JPEG, PNG, GIF, WebP) y PDFs hasta 50MB
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

