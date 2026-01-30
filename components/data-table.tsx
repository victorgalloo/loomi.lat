import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatters";
import { ChevronDown, ChevronUp } from "lucide-react";

type ColumnConfig = {
  accessor: string;
  label: string;
  numeric?: boolean;
};

type SortState = {
  accessor: string;
  direction: "asc" | "desc";
} | null;

type DataTableProps = {
  caption?: string;
  columns: ColumnConfig[];
  rows: Record<string, string | number>[];
  defaultSort?: SortState;
};

// Lightweight data table inspired by shadcn/ui tables with sortable headers.
export const DataTable = ({
  caption,
  columns,
  rows,
  defaultSort
}: DataTableProps) => {
  const [sortState, setSortState] = useState<SortState>(defaultSort ?? null);

  const sortedRows = useMemo(() => {
    if (!sortState) return rows;
    const { accessor, direction } = sortState;
    return [...rows].sort((a, b) => {
      const valueA = a[accessor];
      const valueB = b[accessor];

      if (typeof valueA === "number" && typeof valueB === "number") {
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      return direction === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  }, [rows, sortState]);

  const resolveDisplayValue = (value: string | number, column: ColumnConfig) => {
    if (typeof value === "number") {
      const isPercent =
        column.accessor.toLowerCase().includes("growth") ||
        column.accessor.toLowerCase().includes("rate");
      return formatNumber(value, { percent: isPercent });
    }
    return value;
  };

  const handleSortToggle = (column: ColumnConfig) => {
    setSortState((prev) => {
      if (!prev || prev.accessor !== column.accessor) {
        return { accessor: column.accessor, direction: column.numeric ? "desc" : "asc" };
      }

      if (prev.direction === "desc") {
        return { accessor: column.accessor, direction: "asc" };
      }

      return null;
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-black/5 bg-white/90 shadow-inner">
      <div className="max-h-[360px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/80">
              {columns.map((column) => {
                const isSorted = sortState?.accessor === column.accessor;
                return (
                  <TableHead
                    key={column.accessor}
                    onClick={() => handleSortToggle(column)}
                    className={cn(
                      "cursor-pointer select-none text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                      column.numeric && "text-right"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        column.numeric && "justify-end"
                      )}
                    >
                      <span>{column.label}</span>
                      {isSorted && (
                        <span className="text-muted-foreground">
                          {sortState?.direction === "desc" ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell
                    key={column.accessor}
                    className={cn(column.numeric && "text-right font-semibold")}
                  >
                    {resolveDisplayValue(row[column.accessor], column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {caption ? <TableCaption>{caption}</TableCaption> : null}
        </Table>
      </div>
    </div>
  );
};

