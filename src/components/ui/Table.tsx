import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="max-h-[65vh] overflow-auto rounded-t-lg">{children}</div>;
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("sticky top-0 z-10 bg-mist", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-mist/60", className)} {...props} />;
}

export function TH({
  className,
  sortable,
  sortDir,
  onClick,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { sortable?: boolean; sortDir?: "asc" | "desc" | null }) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted",
        sortable && "cursor-pointer select-none hover:text-ink",
        className
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {props.children}
        {sortable &&
          (sortDir === "asc" ? (
            <ArrowUp size={12} />
          ) : sortDir === "desc" ? (
            <ArrowDown size={12} />
          ) : (
            <ArrowUpDown size={12} className="opacity-40" />
          ))}
      </span>
    </th>
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("whitespace-nowrap px-4 py-3 text-ink", className)} {...props} />;
}

export function TableSkeletonRow({ cols }: { cols: number }) {
  return (
    <TR>
      {Array.from({ length: cols }).map((_, i) => (
        <TD key={i}>
          <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-line" />
        </TD>
      ))}
    </TR>
  );
}
