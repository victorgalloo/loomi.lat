import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Paperclip, Mic, SendHorizontal, ChevronDown } from "lucide-react";

type ChatInputProps = {
  onSubmit: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

const MODES = [
  { value: "quick", label: "Quick insight" },
  { value: "detailed", label: "Detailed analysis" },
  { value: "table", label: "Table view" }
];

// Copilot-style input bar with inline switches and icons.
export const ChatInput = ({ onSubmit, className, disabled }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState(MODES[0]);

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-3 border-t border-white/20 bg-white/80 backdrop-blur-sm p-5 md:flex-row md:items-center md:gap-4 md:p-6",
        className
      )}
    >
      <div className="flex w-full items-center gap-3 rounded-full border-2 border-black/20 bg-white px-5 py-3 shadow-sm transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(255,159,50,0.1)] focus-within:ring-2 focus-within:ring-primary/20">
        <Input
          className="h-auto flex-1 border-none bg-transparent px-0 text-base font-medium text-black/90 placeholder:text-black/50 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Ask about sales, points of sale, trends…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-black/70 hover:bg-neutral-200 hover:text-black/90"
              disabled={disabled}
            >
              {mode.label}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MODES.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onSelect={() => setMode(item)}
                className="justify-between"
              >
                {item.label}
                {mode.value === item.value && (
                  <span className="text-[11px] uppercase tracking-wide text-primary">
                    Active
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-neutral-100 text-black/60 hover:bg-neutral-200 hover:text-black/80"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-neutral-100 text-black/60 hover:bg-neutral-200 hover:text-black/80"
          disabled={disabled}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={() => handleSubmit()}
          className="h-12 w-12 rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(255,159,50,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(255,159,50,0.4)] hover:bg-primary/90"
          disabled={disabled || !value.trim()}
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

