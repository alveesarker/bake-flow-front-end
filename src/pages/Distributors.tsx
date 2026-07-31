import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Eye } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useToast } from "../hooks/useToast";
import { useTableData } from "../hooks/useTableData";
import { PageHeader, SearchInput, EmptyState, Pagination } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, FieldError, Input, Select } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableWrap } from "../components/ui/Table";
import type { Status } from "../types";

// ---------------------------------------------------------------------------
// API layer
// ---------------------------------------------------------------------------

// NOTE: hardcoded per the endpoints you shared. Move this to an env var
// (e.g. import.meta.env.VITE_API_URL) once you have a build config for it.
const API_BASE = "http://localhost:5000/api/distributor";

// Shape returned by the backend (distinct from any local mock `Distributor` type)
type ApiDistributor = {
  distributor_id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: "Active" | "Inactive";
};

type OrderInfo = {
  distributor_id: number;
  total_purchased_amount: string;
  total_paid_amount: string;
  total_due: string;
  total_orders: number;
};

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || "Request failed");
  return json.data as T;
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  // The POST sample response returns the object directly (no `data` wrapper) — handle both.
  return (json.data ?? json) as T;
}

async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || "Request failed");
  return json.data as T;
}

// ---------------------------------------------------------------------------
// Add / Edit dialog
// ---------------------------------------------------------------------------

function useDistributorSchema() {
  const { t } = useTranslation();
  return z.object({
    name: z.string().min(2, t("validation.tooShort")),
    phone: z.string().min(6, t("validation.invalidPhone")),
    email: z.string().email(t("validation.invalidEmail")),
    address: z.string().min(2, t("validation.requiredField")),
    status: z.enum(["Active", "Inactive"]),
  });
}
type DistributorFormValues = z.infer<ReturnType<typeof useDistributorSchema>>;

function DistributorFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: ApiDistributor | null;
  onSaved: (d: ApiDistributor) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const schema = useDistributorSchema();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DistributorFormValues>({
    resolver: zodResolver(schema),
    // `values` (not `defaultValues`) so the form re-syncs whenever `editing` changes,
    // e.g. clicking Edit on a different row while the dialog is already mounted.
    values: editing
      ? { name: editing.name, phone: editing.phone, email: editing.email, address: editing.address, status: editing.status }
      : { name: "", phone: "", email: "", address: "", status: "Active" },
  });

  const onSubmit = async (values: DistributorFormValues) => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiPut<ApiDistributor>(`${API_BASE}/${editing.distributor_id}`, values);
        onSaved({ ...editing, ...updated });
        toast({ variant: "success", title: t("toast.updatedTitle"), description: t("toast.updatedDesc", { item: values.name }) });
      } else {
        const created = await apiPost<ApiDistributor>(API_BASE, values);
        onSaved(created);
        toast({ variant: "success", title: t("toast.createdTitle"), description: t("toast.createdDesc", { item: values.name }) });
      }
      reset();
      onClose();
    } catch (err) {
      toast({
        variant: "error",
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("distributors.editDistributor") : t("distributors.addDistributor")}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>{t("common.cancel")}</Button>
          <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? "..." : t("common.save")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldLabel required>{t("distributors.form.name")}</FieldLabel>
          <Input invalid={!!errors.name} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("distributors.form.phone")}</FieldLabel>
            <Input invalid={!!errors.phone} {...register("phone")} />
            <FieldError>{errors.phone?.message}</FieldError>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("distributors.form.email")}</FieldLabel>
            <Input invalid={!!errors.email} {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel required>{t("distributors.form.address")}</FieldLabel>
          <Input invalid={!!errors.address} {...register("address")} />
          <FieldError>{errors.address?.message}</FieldError>
        </FieldGroup>
        <FieldGroup className="mb-0">
          <FieldLabel>{t("distributors.form.status")}</FieldLabel>
          <Select {...register("status")}>
            <option value="Active">{t("common.active")}</option>
            <option value="Inactive">{t("common.inactive")}</option>
          </Select>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// View dialog
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted mb-0.5">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border border-line p-3 ${highlight ? "bg-danger/5" : "bg-surface"}`}>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? "text-danger" : ""}`}>{value}</div>
    </div>
  );
}

function DistributorViewDialog({
  open,
  onClose,
  distributor,
}: {
  open: boolean;
  onClose: () => void;
  distributor: ApiDistributor | null;
}) {
  const { t } = useTranslation();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !distributor) return;
    setLoading(true);
    setError(null);
    setOrderInfo(null);
    apiGet<OrderInfo>(`${API_BASE}/order-info/${distributor.distributor_id}`)
      .then(setOrderInfo)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order summary"))
      .finally(() => setLoading(false));
  }, [open, distributor]);

  if (!distributor) return null;

  const money = (v: string) =>
    `৳${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    // NOTE: assumes Dialog forwards `className` to its panel for a wider "big dialog".
    // If it doesn't yet, add that prop to your Dialog component.
    <Dialog open={open} onClose={onClose} title="Distributor Details" size="xl" >
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
        <InfoRow label="ID" value={`#${distributor.distributor_id}`} />
        <InfoRow label={t("distributors.columns.name")} value={distributor.name} />
        <InfoRow label="Email" value={distributor.email} />
        <InfoRow label={t("distributors.columns.phone")} value={distributor.phone} />
        <InfoRow label={t("distributors.columns.address")} value={distributor.address} />
        <InfoRow label={t("distributors.columns.status")} value={<StatusBadge status={distributor.status.toLowerCase() as Status} />} />
      </div>

      {loading && <div className="text-sm text-muted py-4">Loading order summary...</div>}
      {error && <div className="text-sm text-danger py-4">{error}</div>}

      {orderInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Total Purchased" value={money(orderInfo.total_purchased_amount)} />
          <SummaryCard label="Total Paid" value={money(orderInfo.total_paid_amount)} />
          <SummaryCard label="Total Due" value={money(orderInfo.total_due)} highlight />
          <SummaryCard label="Total Orders" value={String(orderInfo.total_orders)} />
        </div>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Distributors() {
  const { t } = useTranslation();

  const [distributors, setDistributors] = useState<ApiDistributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiDistributor | null>(null);
  const [viewing, setViewing] = useState<ApiDistributor | null>(null);
  const [status, setStatus] = useState("all");

  const loadDistributors = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    apiGet<ApiDistributor[]>(API_BASE)
      .then(setDistributors)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load distributors"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDistributors();
  }, [loadDistributors]);

  const handleSaved = (saved: ApiDistributor) => {
    setDistributors((prev) => {
      const exists = prev.some((d) => d.distributor_id === saved.distributor_id);
      return exists ? prev.map((d) => (d.distributor_id === saved.distributor_id ? saved : d)) : [...prev, saved];
    });
  };

  const filtered = distributors.filter((d) => status === "all" || d.status.toLowerCase() === status);
  const table = useTableData(filtered, { searchFields: (d) => [d.name, d.phone, d.address], pageSize: 8 });

  return (
    <div>
      <PageHeader
        title={t("distributors.title")}
        subtitle={t("distributors.subtitle")}
        action={
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus size={16} /> {t("distributors.addDistributor")}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("distributors.searchPlaceholder")} />
          <Select className="!h-9 w-auto max-w-[150px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{t("common.allStatuses")}</option>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </Select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading distributors...</div>
        ) : loadError ? (
          <div className="p-8 text-center text-sm text-danger">
            {loadError}
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={loadDistributors}>Retry</Button>
            </div>
          </div>
        ) : table.rows.length === 0 ? (
          <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH sortable sortDir={table.sortKey === "name" ? table.sortDir : null} onClick={() => table.toggleSort("name")}>
                    {t("distributors.columns.name")}
                  </TH>
                  <TH>{t("distributors.columns.phone")}</TH>
                  <TH>{t("distributors.columns.address")}</TH>
                  <TH>{t("distributors.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((d) => (
                  <TR key={d.distributor_id}>
                    <TD className="font-medium">{d.name}</TD>
                    <TD className="num text-muted">{d.phone}</TD>
                    <TD className="text-muted">{d.address}</TD>
                    <TD><StatusBadge status={d.status.toLowerCase() as Status} /></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewing(d)} aria-label="View">
                          <Eye size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setDialogOpen(true); }} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
        <Pagination page={table.page} totalPages={table.totalPages} onChange={table.setPage} totalItems={table.totalItems} pageSize={table.pageSize} />
      </Card>

      <DistributorFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} onSaved={handleSaved} />
      <DistributorViewDialog open={!!viewing} onClose={() => setViewing(null)} distributor={viewing} />
    </div>
  );
}