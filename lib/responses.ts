// Response builder using the intelligent query engine

import { ReactNode } from "react";
import { processQuery } from "./queryEngine";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: ReactNode;
};

export type AssistantResponse = {
  heading: string;
  summary: string;
  table: {
    caption: string;
    columns: { accessor: string; label: string; numeric?: boolean; sortable?: boolean }[];
    rows: Record<string, string | number>[];
    sort?: { accessor: string; direction: "asc" | "desc" };
  };
};

export const buildAssistantResponse = (userQuery: string): AssistantResponse => {
  const result = processQuery(userQuery);

  return {
    heading: result.heading,
    summary: result.summary,
    table: {
      caption: result.heading,
      columns: result.columns.map(col => ({
        accessor: col.accessor,
        label: col.label,
        sortable: col.sortable
      })),
      rows: result.data,
      sort: result.columns && result.columns[0]
        ? { accessor: result.columns[0].accessor, direction: "asc" }
        : undefined
    }
  };
};

