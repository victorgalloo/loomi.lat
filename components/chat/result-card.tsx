import { DataTable } from "@/components/data-table";
import { AssistantResponse } from "@/lib/responses";
import { DownloadMenu } from "@/components/data-export/download-menu";

type ResultCardProps = {
  response: AssistantResponse;
};

// Assistant message containing a heading, summary and data table.
export const ResultCard = ({ response }: ResultCardProps) => {
  const { heading, summary, table } = response;

  return (
    <div className="liquid-glass flex flex-col gap-5 rounded-[28px] p-7 text-left md:p-9" style={{ transform: "translateZ(0)", willChange: "transform", backfaceVisibility: "hidden" }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2.5">
          <h4 className="text-[22px] font-semibold leading-tight tracking-tight text-base-foreground">{heading}</h4>
          <p className="max-w-2xl text-[15px] font-normal leading-relaxed text-base-foreground/80 md:text-[16px]">
            {summary}
          </p>
        </div>
        <DownloadMenu table={table} heading={heading} summary={summary} />
      </div>

      <DataTable
        caption={table.caption}
        columns={table.columns}
        rows={table.rows}
        defaultSort={table.sort}
      />
    </div>
  );
};

