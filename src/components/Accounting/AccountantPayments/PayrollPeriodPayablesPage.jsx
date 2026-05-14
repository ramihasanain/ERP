import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBasePath } from "@/hooks/useBasePath";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Spinner from "@/core/Spinner";
import ResourceLoadError from "@/core/ResourceLoadError";
import SearchableSelectBackend from "@/core/SearchableSelectBackend";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPost } from "@/hooks/useMutation";
import { ArrowLeft, Download, X } from "lucide-react";

const formatMoneyAmount = (value, currency = "USD") => {
  const num = Number(value);
  if (Number.isNaN(num)) return `— ${currency}`;
  return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const formatPayDateTime = (value) => {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPayDate = (value) => {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const selectBankAccounts = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response)) return response;
  return [];
};

const paymentCoversLabel = (p) => {
  const parts = [];
  if (p?.pays_net) parts.push("Net");
  if (p?.pays_allowances) parts.push("Allowances");
  if (p?.pays_social_security) parts.push("Social security");
  if (p?.pays_income_tax) parts.push("Income tax");
  return parts.length ? parts.join(", ") : "—";
};

const getStatusBadgeStyles = (status) => {
  const normalized = String(status ?? "").toLowerCase();
  const isGreen = normalized === "posted" || normalized === "paid";
  const isOrange = normalized === "partially_paid";
  const tone = isGreen ? "success" : isOrange ? "warning" : "primary-600";

  if (tone === "primary-600") {
    return {
      background:
        "color-mix(in srgb, var(--color-primary-600) 15%, var(--color-bg-card))",
      color: "var(--color-primary-600)",
    };
  }

  return {
    background: `color-mix(in srgb, var(--color-${tone}) 18%, var(--color-bg-card))`,
    color: `var(--color-${tone})`,
  };
};

const humanizeStatus = (status) => {
  const normalized = String(status ?? "").toLowerCase();
  if (!normalized) return "—";
  if (normalized === "partially_paid") return "Partially Paid";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const PayCategoryModal = ({
  periodId,
  category,
  currency,
  onClose,
  onPaid,
}) => {
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  const bankAccountsQuery = useCustomQuery("/accounting/bank-accounts/", [
    "accounting-bank-accounts",
  ], {
    select: selectBankAccounts,
  });

  const bankOptions = useMemo(() => {
    const rawAccounts = bankAccountsQuery.data ?? [];
    const active = rawAccounts.filter((a) => a?.is_active !== false);
    const q = bankSearchTerm.trim().toLowerCase();
    if (!q) return active;
    return active.filter((a) => {
      const hay = [
        a?.name,
        a?.account_name,
        a?.account_code,
        a?.bank_name,
        a?.account_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [bankAccountsQuery.data, bankSearchTerm]);

  const payMutation = useCustomPost(
    `/api/hr/payroll/periods/${periodId}/pay/`,
    [
      ["hr-payroll-period-payables", periodId],
      ["hr-payroll-dashboard-accountant"],
      ["hr-payroll-dashboard"],
    ],
  );

  const getBankValue = (acc) =>
    acc?.account_id != null && String(acc.account_id).trim() !== ""
      ? String(acc.account_id)
      : String(acc?.id ?? "");

  const handlePay = async () => {
    if (!bankAccountId || !category?.key) return;
    try {
      await payMutation.mutateAsync({
        bank_account_id: bankAccountId,
        categories: [category.key],
      });
      toast.success("Payment recorded.");
      onPaid?.();
      onClose();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      toast.error(
        typeof detail === "string" ? detail : "Payment failed.",
      );
    }
  };

  if (!category) return null;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "color-mix(in srgb, var(--color-text-main) 45%, transparent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
      onKeyDown={(ev) => {
        if (ev.key === "Escape") onClose();
      }}
    >
      <Card
        className="padding-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-category-title"
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer"
          aria-label="Close"
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            border: "none",
            background: "transparent",
            color: "var(--color-text-secondary)",
            padding: "0.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} />
        </button>
        <h3
          id="pay-category-title"
          style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 2rem 1rem 0" }}
        >
          Pay category
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Category
            </div>
            <div style={{ fontWeight: 600 }}>{category.label}</div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Amount
            </div>
            <div style={{ fontWeight: 600 }}>
              {formatMoneyAmount(category.amount, currency)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Bank outflow
            </div>
            <div style={{ fontWeight: 600 }}>
              {formatMoneyAmount(category.bank_outflow, currency)}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            Bank account
          </label>
          <SearchableSelectBackend
            value={bankAccountId}
            onChange={(v) => setBankAccountId(v || "")}
            options={bankOptions}
            searchTerm={bankSearchTerm}
            onSearchChange={setBankSearchTerm}
            placeholder="Search bank accounts..."
            emptyLabel="No bank accounts found"
            getOptionLabel={(option) =>
              [
                option?.account_code,
                option?.account_name || option?.name,
                option?.currency_code ? `(${option.currency_code})` : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            getOptionValue={getBankValue}
            isInitialLoading={bankAccountsQuery.isLoading}
            zIndex={1200}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button variant="outline" className="cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="cursor-pointer"
            disabled={!bankAccountId}
            isLoading={payMutation.isPending}
            onClick={handlePay}
          >
            Pay
          </Button>
        </div>
      </Card>
    </div>
  );
};

const PayrollPeriodPayablesPage = () => {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const basePath = useBasePath();
  const [payCategory, setPayCategory] = useState(null);

  const periodQuery = useCustomQuery(
    periodId ? `/api/hr/payroll/periods/${periodId}/` : null,
    ["hr-payroll-period", periodId],
    { enabled: Boolean(periodId) },
  );

  const payablesQuery = useCustomQuery(
    periodId ? `/api/hr/payroll/periods/${periodId}/payables/` : null,
    ["hr-payroll-period-payables", periodId],
    { enabled: Boolean(periodId) },
  );

  const period = periodQuery.data;
  const payables = payablesQuery.data;
  const currency = payables?.currency ?? period?.currency ?? "USD";
  const categories = Array.isArray(payables?.categories)
    ? payables.categories
    : [];
  const payments = Array.isArray(payables?.payments) ? payables.payments : [];

  const rawStatus = payables?.status ?? period?.status ?? "";
  const statusLabel = humanizeStatus(rawStatus);
  const statusStyles = getStatusBadgeStyles(rawStatus);

  const handleExportXlsx = () => {
    if (!periodId || !payables) return;
    const wb = XLSX.utils.book_new();

    const catRows = categories.map((c) => ({
      key: c?.key ?? "",
      label: c?.label ?? "",
      amount: c?.amount ?? "",
      bank_outflow: c?.bank_outflow ?? "",
      paid: c?.paid === true ? "Yes" : "No",
    }));
    const wsCat =
      catRows.length > 0
        ? XLSX.utils.json_to_sheet(catRows)
        : XLSX.utils.aoa_to_sheet([["No categories"]]);
    XLSX.utils.book_append_sheet(wb, wsCat, "Categories");

    const payRows = payments.map((p) => ({
      journal_reference: p?.journal_reference ?? "",
      bank_account_code: p?.bank_account_code ?? "",
      bank_account_name: p?.bank_account_name ?? "",
      paid_at: p?.paid_at ?? "",
      covers: paymentCoversLabel(p),
      net_amount: p?.net_amount ?? "",
      allowances_amount: p?.allowances_amount ?? "",
      social_security_amount: p?.social_security_amount ?? "",
      income_tax_amount: p?.income_tax_amount ?? "",
      total_amount: p?.total_amount ?? "",
    }));
    const wsPay =
      payRows.length > 0
        ? XLSX.utils.json_to_sheet(payRows)
        : XLSX.utils.aoa_to_sheet([["No payments"]]);
    XLSX.utils.book_append_sheet(wb, wsPay, "Payments");

    XLSX.writeFile(wb, `payroll-payables-${periodId}.xlsx`);
    toast.success("Export started.");
  };

  if (!periodId) {
    return (
      <Card className="padding-lg">
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Missing period id.
        </p>
        <Button
          variant="outline"
          className="cursor-pointer"
          style={{ marginTop: "1rem" }}
          onClick={() => navigate(`${basePath}/accounting/accountant-payments`)}
        >
          Back
        </Button>
      </Card>
    );
  }

  if (payablesQuery.isLoading && !payablesQuery.data) {
    return <Spinner />;
  }

  if (payablesQuery.isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Button
          variant="ghost"
          className="cursor-pointer"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(`${basePath}/accounting/accountant-payments`)}
        >
          Back
        </Button>
        <ResourceLoadError
          error={payablesQuery.error}
          title="Could not load payables"
          onGoBack={() => navigate(`${basePath}/accounting/accountant-payments`)}
          onRefresh={() => payablesQuery.refetch()}
        />
      </div>
    );
  }

  const title = period?.name || `Period ${periodId}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="ghost"
          className="cursor-pointer shrink-0"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(`${basePath}/accounting/accountant-payments`)}
        >
          Back
        </Button>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{title}</h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "0.35rem",
            }}
          >
            {period?.period_start && period?.period_end ? (
              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                {formatPayDate(period.period_start)} to{" "}
                {formatPayDate(period.period_end)}
                {period.pay_date
                  ? ` · Pay date ${formatPayDate(period.pay_date)}`
                  : ""}
              </span>
            ) : null}
            <span
              style={{
                padding: "0.2rem 0.5rem",
                borderRadius: "1rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                ...statusStyles,
              }}
            >
              {statusLabel}
            </span>
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              {currency}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="cursor-pointer"
          icon={<Download size={18} />}
          onClick={handleExportXlsx}
          disabled={!payables}
        >
          Export XLSX
        </Button>
      </div>

      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Categories
        </h3>
        <Card className="padding-none">
          <div className="overflow-x-auto">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--color-bg-table-header)",
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                  }}
                >
                  <th
                    style={{
                      padding: "0.75rem 1.5rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Label
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Bank outflow
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Paid
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "1.5rem",
                        color: "var(--color-text-secondary)",
                        textAlign: "center",
                      }}
                    >
                      No categories.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => {
                    const isPaid = c?.paid === true;
                    return (
                      <tr
                        key={c?.key ?? c?.label}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <td style={{ padding: "1rem 1.5rem", fontWeight: 500 }}>
                          {c?.label ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: "1rem 1rem",
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          {formatMoneyAmount(c?.amount, currency)}
                        </td>
                        <td
                          style={{
                            padding: "1rem 1rem",
                            textAlign: "right",
                          }}
                        >
                          {formatMoneyAmount(c?.bank_outflow, currency)}
                        </td>
                        <td style={{ padding: "1rem 1rem" }}>
                          <span
                            style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "1rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: isPaid
                                ? "color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))"
                                : "color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))",
                              color: isPaid
                                ? "var(--color-success)"
                                : "var(--color-warning)",
                            }}
                          >
                            {isPaid ? "Yes" : "No"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem 1rem", textAlign: "right" }}>
                          {!isPaid ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => setPayCategory(c)}
                            >
                              Pay
                            </Button>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Payments
        </h3>
        <Card className="padding-none">
          <div className="overflow-x-auto">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
                minWidth: "720px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--color-bg-table-header)",
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                  }}
                >
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Journal
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Bank account
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Paid at
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Covers
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Net
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    SS
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Tax
                  </th>
                  <th
                    style={{
                      padding: "0.75rem 1rem",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "1.5rem",
                        color: "var(--color-text-secondary)",
                        textAlign: "center",
                      }}
                    >
                      No payments yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr
                      key={p?.id ?? p?.journal_reference}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <td style={{ padding: "1rem 1rem", fontWeight: 500 }}>
                        {p?.journal_reference ?? "—"}
                      </td>
                      <td style={{ padding: "1rem 1rem" }}>
                        {[p?.bank_account_code, p?.bank_account_name]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td style={{ padding: "1rem 1rem", fontSize: "0.85rem" }}>
                        {formatPayDateTime(p?.paid_at)}
                      </td>
                      <td style={{ padding: "1rem 1rem", fontSize: "0.85rem" }}>
                        {paymentCoversLabel(p)}
                      </td>
                      <td
                        style={{
                          padding: "1rem 1rem",
                          textAlign: "right",
                        }}
                      >
                        {formatMoneyAmount(p?.net_amount, currency)}
                      </td>
                      <td
                        style={{
                          padding: "1rem 1rem",
                          textAlign: "right",
                        }}
                      >
                        {formatMoneyAmount(p?.social_security_amount, currency)}
                      </td>
                      <td
                        style={{
                          padding: "1rem 1rem",
                          textAlign: "right",
                        }}
                      >
                        {formatMoneyAmount(p?.income_tax_amount, currency)}
                      </td>
                      <td
                        style={{
                          padding: "1rem 1rem",
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        {formatMoneyAmount(p?.total_amount, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {payCategory ? (
        <PayCategoryModal
          key={payCategory.key ?? payCategory.label ?? "pay"}
          periodId={periodId}
          category={payCategory}
          currency={currency}
          onClose={() => setPayCategory(null)}
          onPaid={() => payablesQuery.refetch()}
        />
      ) : null}
    </div>
  );
};

export default PayrollPeriodPayablesPage;
