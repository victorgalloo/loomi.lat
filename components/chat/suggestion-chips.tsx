import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SuggestionChipsProps = {
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

const SUGGESTIONS = [
  "Muéstrame las líneas de producción",
  "Embarques en tránsito",
  "Top vendedores del mes",
  "Almacenes y su utilización",
  "Departamentos y presupuestos",
  "Puntos de venta en Jalisco",
  "Productos manufacturados",
  "Rutas de distribución activas"
];

// Row of Copilot-like chips that send canned prompts.
export const SuggestionChips = ({
  onSelect,
  disabled,
  className
}: SuggestionChipsProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      {SUGGESTIONS.map((suggestion) => (
        <Button
          key={suggestion}
          type="button"
          variant="ghost"
          size="sm"
          className="liquid-glass h-auto rounded-2xl border border-white/30 px-4 py-2.5 text-[13px] font-medium text-base-foreground/80 transition-all hover:border-white/50 hover:text-base-foreground hover:shadow-lg disabled:opacity-50"
          onClick={() => !disabled && onSelect(suggestion)}
          disabled={disabled}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
};

