import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../i18n/I18nContext";
import type { Status, StockStatus, ProductionStatus } from "../../types";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const tones: Record<string, string> = {
    neutral: "bg-mist text-muted",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    danger: "bg-danger-bg text-danger",
    info: "bg-info-bg text-info",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useTranslation();
  return <Badge tone={status === "active" ? "success" : "neutral"}>{t(`common.${status}`)}</Badge>;
}

export function StockBadge({ status }: { status: StockStatus }) {
  const { t } = useTranslation();
  const tone = status === "inStock" ? "success" : status === "lowStock" ? "warning" : "danger";
  return <Badge tone={tone}>{t(`common.${status}`)}</Badge>;
}

export function ProductionStatusBadge({ status }: { status: ProductionStatus }) {
  const { t } = useTranslation();
  const tone = status === "completed" ? "success" : status === "inProgress" ? "info" : "warning";
  return <Badge tone={tone}>{t(`production.statuses.${status}`)}</Badge>;
}
