import { TrendingUp, PackageSearch, Boxes, AlertTriangle, Trophy, PieChart, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { PageHeader } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

const cards = [
  { key: "salesPrediction", icon: TrendingUp },
  { key: "demandForecast", icon: PackageSearch },
  { key: "inventoryRecommendation", icon: Boxes },
  { key: "lowStockPrediction", icon: AlertTriangle },
  { key: "bestSelling", icon: Trophy },
  { key: "expenseAnalysis", icon: PieChart },
] as const;

export default function AIInsights() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("aiInsights.title")} subtitle={t("aiInsights.subtitle")} />

      <div className="mb-5 flex items-start gap-2.5 rounded-md border border-line bg-paper px-4 py-3">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-muted" />
        <p className="text-xs text-muted">{t("aiInsights.disclaimer")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ key, icon: Icon }) => (
          <Card key={key} className="flex flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-mist text-ink">
                <Icon size={17} />
              </div>
              <Badge tone="info">{t("aiInsights.badge")}</Badge>
            </div>
            <h3 className="font-display text-[15px] font-semibold text-ink">{t(`aiInsights.cards.${key}.title`)}</h3>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{t(`aiInsights.cards.${key}.desc`)}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" disabled>
              {t("aiInsights.viewInsight")} <ArrowRight size={13} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
