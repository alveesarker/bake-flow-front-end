import { useState } from "react";
import { Building2, SlidersHorizontal, UserCog, DatabaseBackup, Upload, Download, Sun, Moon } from "lucide-react";
import { useTranslation, useI18n } from "../i18n/I18nContext";
import { useToast } from "../hooks/useToast";
import { PageHeader } from "../components/ui/Misc";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FieldGroup, FieldLabel, Input, Select } from "../components/ui/Field";
import { cn } from "../lib/utils";

const tabs = [
  { key: "business", icon: Building2 },
  { key: "preferences", icon: SlidersHorizontal },
  { key: "account", icon: UserCog },
  { key: "data", icon: DatabaseBackup },
] as const;

export default function Settings() {
  const { t } = useTranslation();
  const { lang, setLang } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("business");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currency, setCurrency] = useState("BDT");

  const save = () => toast({ variant: "success", title: t("settings.saved") });

  return (
    <div>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <div className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors lg:shrink",
                tab === key ? "bg-ink text-white" : "text-muted hover:bg-mist hover:text-ink"
              )}
            >
              <Icon size={15} /> {t(`settings.tabs.${key}`)}
            </button>
          ))}
        </div>

        <div>
          {tab === "business" && (
            <Card>
              <CardHeader><CardTitle>{t("settings.tabs.business")}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  <FieldGroup>
                    <FieldLabel>{t("settings.business.name")}</FieldLabel>
                    <Input defaultValue="BakeFlow Artisan Bakery" />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>{t("settings.business.phone")}</FieldLabel>
                    <Input defaultValue="02-9876543" />
                  </FieldGroup>
                  <FieldGroup className="sm:col-span-2">
                    <FieldLabel>{t("settings.business.address")}</FieldLabel>
                    <Input defaultValue="House 12, Road 5, Dhanmondi, Dhaka" />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>{t("settings.business.email")}</FieldLabel>
                    <Input defaultValue="hello@bakeflow.example" />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>{t("settings.business.logo")}</FieldLabel>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-mist text-xl">🥐</div>
                      <Button variant="outline" size="sm">{t("settings.business.uploadLogo")}</Button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted">{t("settings.business.logoHint")}</p>
                  </FieldGroup>
                </div>
                <Button onClick={save}>{t("common.save")}</Button>
              </CardContent>
            </Card>
          )}

          {tab === "preferences" && (
            <Card>
              <CardHeader><CardTitle>{t("settings.tabs.preferences")}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  <FieldGroup>
                    <FieldLabel>{t("settings.preferences.language")}</FieldLabel>
                    <Select value={lang} onChange={(e) => setLang(e.target.value as "en" | "bn")}>
                      <option value="en">English</option>
                      <option value="bn">বাংলা</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>{t("settings.preferences.currency")}</FieldLabel>
                    <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup className="sm:col-span-2">
                    <FieldLabel>{t("settings.preferences.theme")}</FieldLabel>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setTheme("light")}
                        className={cn("flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium",
                          theme === "light" ? "border-ink bg-ink text-white" : "border-line text-muted hover:bg-mist")}
                      >
                        <Sun size={14} /> {t("settings.preferences.light")}
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={cn("flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium",
                          theme === "dark" ? "border-ink bg-ink text-white" : "border-line text-muted hover:bg-mist")}
                      >
                        <Moon size={14} /> {t("settings.preferences.dark")}
                      </button>
                    </div>
                  </FieldGroup>
                </div>
                <Button onClick={save}>{t("common.save")}</Button>
              </CardContent>
            </Card>
          )}

          {tab === "account" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{t("settings.account.profile")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FieldGroup>
                      <FieldLabel>{t("settings.account.fullName")}</FieldLabel>
                      <Input defaultValue="Nasrin Jahan" />
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel>{t("settings.account.email")}</FieldLabel>
                      <Input defaultValue="nasrin@bakeflow.example" />
                    </FieldGroup>
                  </div>
                  <Button onClick={save}>{t("common.save")}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t("settings.account.changePassword")}</CardTitle></CardHeader>
                <CardContent>
                  <FieldGroup>
                    <FieldLabel>{t("settings.account.currentPassword")}</FieldLabel>
                    <Input type="password" />
                  </FieldGroup>
                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FieldGroup>
                      <FieldLabel>{t("settings.account.newPassword")}</FieldLabel>
                      <Input type="password" />
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel>{t("settings.account.confirmPassword")}</FieldLabel>
                      <Input type="password" />
                    </FieldGroup>
                  </div>
                  <Button onClick={save}>{t("common.save")}</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "data" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{t("settings.data.backup")}</CardTitle></CardHeader>
                <CardContent>
                  <p className="mb-4 text-[13px] text-muted">{t("settings.data.backupDesc")}</p>
                  <Button variant="outline" onClick={save}><Download size={15} /> {t("settings.data.backupAction")}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t("settings.data.restore")}</CardTitle></CardHeader>
                <CardContent>
                  <p className="mb-4 text-[13px] text-muted">{t("settings.data.restoreDesc")}</p>
                  <Button variant="outline" onClick={save}><Upload size={15} /> {t("settings.data.restoreAction")}</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
