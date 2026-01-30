"use client";

interface PdfExportLoadingProps {
  isOpen: boolean;
  message: string;
}

export function PdfExportLoading({ isOpen, message }: PdfExportLoadingProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
    >
      <div
        className="rounded-2xl p-8 flex flex-col items-center gap-4 max-w-md mx-4"
        style={{
          backgroundColor: `var(--background)`,
          border: `1px solid var(--border)`,
        }}
      >
        <div className="relative">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: `var(--accent)` }}
          />
        </div>
        <div className="text-center">
          <p
            className="text-lg font-semibold mb-2 transition-colors duration-300"
            style={{ color: `var(--foreground)` }}
          >
            Generando PDF...
          </p>
          <p
            className="text-sm transition-colors duration-300"
            style={{ color: `var(--muted-foreground)` }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

