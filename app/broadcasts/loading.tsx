export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4">
      <span className="text-7xl font-mono text-foreground animate-blink">_</span>
      <span className="text-sm text-muted">Cargando...</span>
    </div>
  );
}
