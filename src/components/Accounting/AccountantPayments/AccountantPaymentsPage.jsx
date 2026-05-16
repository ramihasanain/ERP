import { useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { useBasePath } from "@/hooks/useBasePath";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import { toast } from "sonner";
import Spinner from "@/core/Spinner";
import ResourceLoadError from "@/core/ResourceLoadError";
import SearchableSelectBackend from "@/core/SearchableSelectBackend";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPost } from "@/hooks/useMutation";
import { ArrowLeft, BarChart2, List, X } from "lucide-react";
import styles from "@/components/Accounting/AccountantPayments/AccountantPayments.module.css";

const formatMoneyAmount = (value, currency = "USD") => {
  const num = Number(value);
  if (Number.isNaN(num)) return `— ${currency}`;
  return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const normalizePeriodRow = (item) => ({
  id: item?.id ?? "",
  name: item?.name ?? "",
  status: String(item?.status ?? "").toLowerCase(),
  employeesPaid: Number(item?.employees_paid) || 0,
  totalNet: item?.total_net ?? "0",
  currency: item?.currency ?? "USD",
});

const normalizeDashboard = (response) => {
  const periods = response?.periods?.data;
  const periodList = Array.isArray(periods)
    ? periods.map(normalizePeriodRow)
    : [];
  return {
    periodRows: periodList,
  };
};

const getStatusBadgeStyles = (status) => {
  const normalized = String(status ?? "").toLowerCase();
  const isGreen = normalized === "posted" || normalized === "paid";
  const isOrange = normalized === "partially_paid";
  const tone = isGreen ? "success" : isOrange ? "warning" : "warning";

  return {
    background: `color-mix(in srgb, var(--color-${tone}) 18%, var(--color-bg-card))`,
    color: `var(--color-${tone})`,
  };
};

const getPayrollStatusLabel = (status, t) => {
  const normalized = String(status ?? "").toLowerCase();
  if (!normalized) return "—";
  if (normalized === "partially_paid") {
    return t("accountantPayments.status.partiallyPaid");
  }
  if (normalized === "posted") {
    return t("accountantPayments.status.posted");
  }
  if (normalized === "paid") {
    return t("accountantPayments.status.paid");
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const selectBankAccounts = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response)) return response;
  return [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TerminationPayModal = ({ row, onClose, onPaid }) => {
  const { t } = useTranslation(["accounting", "common"]);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  const employeeId = row?.employee_id || "";
  const payMutation = useCustomPost(
    employeeId ? `/api/hr/employees/${employeeId}/termination/pay/` : null,
    [["hr-terminations-finalized-accountant"]],
  );

  const bankAccountsQuery = useCustomQuery(
    "/accounting/bank-accounts/",
    ["accounting-bank-accounts"],
    { select: selectBankAccounts },
  );

  const bankOptions = useMemo(() => {
    const raw = bankAccountsQuery.data ?? [];
    const active = raw.filter((a) => a?.is_active !== false);
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

  const getBankValue = (acc) =>
    acc?.account_id != null && String(acc.account_id).trim() !== ""
      ? String(acc.account_id)
      : String(acc?.id ?? "");

  const handlePay = async () => {
    if (!employeeId || !bankAccountId) return;
    try {
      await payMutation.mutateAsync({ bank_account_id: bankAccountId });
      toast.success(t("accountantPayments.terminationModal.successToast"));
      onPaid?.();
      onClose();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      toast.error(
        typeof detail === "string"
          ? detail
          : t("accountantPayments.terminationModal.errorToast"),
      );
    }
  };

  if (!row) return null;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background:
          "color-mix(in srgb, var(--color-text-main) 45%, transparent)",
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
        aria-labelledby="pay-termination-title"
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
          aria-label={t("common:actions.close")}
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
          id="pay-termination-title"
          style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 2rem 1rem 0" }}
        >
          {t("accountantPayments.terminationModal.title")}
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
              {t("accountantPayments.terminationModal.employee")}
            </div>
            <div style={{ fontWeight: 600 }}>{row.employee_name || "—"}</div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              {t("accountantPayments.terminationModal.netPayable")}
            </div>
            <div style={{ fontWeight: 600 }}>{formatMoneyAmount(row.net_payable, "USD")}</div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              {t("accountantPayments.terminationModal.date")}
            </div>
            <div style={{ fontWeight: 600 }}>{formatDate(row.date)}</div>
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
            {t("accountantPayments.terminationModal.bankAccount")}
          </label>
          <SearchableSelectBackend
            value={bankAccountId}
            onChange={(v) => setBankAccountId(v || "")}
            options={bankOptions}
            searchTerm={bankSearchTerm}
            onSearchChange={setBankSearchTerm}
            placeholder={t("accountantPayments.terminationModal.searchBankPlaceholder")}
            emptyLabel={t("accountantPayments.terminationModal.noBankAccounts")}
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
            {t("common:actions.cancel")}
          </Button>
          <Button
            variant="primary"
            className="cursor-pointer"
            disabled={!bankAccountId}
            isLoading={payMutation.isPending}
            onClick={handlePay}
          >
            {t("accountantPayments.termination.pay")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const AccountantPaymentsPage = () => {
  const { t } = useTranslation(["accounting", "common"]);
  const navigate = useNavigate();
  const basePath = useBasePath();
  const [activeTab, setActiveTab] = useState("payroll");
  const [terminationToPay, setTerminationToPay] = useState(null);

  const dashboardQuery = useCustomQuery(
    "/api/hr/payroll/dashboard/",
    ["hr-payroll-dashboard-accountant"],
    {
      enabled: activeTab === "payroll",
      select: normalizeDashboard,
    },
  );

  const terminationsQuery = useCustomQuery(
    "/api/hr/terminations/finalized/",
    ["hr-terminations-finalized-accountant"],
    { enabled: activeTab === "termination" },
  );

  const periodRows = useMemo(
    () => dashboardQuery.data?.periodRows ?? [],
    [dashboardQuery.data?.periodRows],
  );

  const terminationRows = useMemo(() => {
    const raw = terminationsQuery.data?.data;
    return Array.isArray(raw) ? raw : [];
  }, [terminationsQuery.data]);

  const payrollLoading = activeTab === "payroll" && dashboardQuery.isLoading;
  const payrollError = activeTab === "payroll" && dashboardQuery.isError;
  const terminationLoading =
    activeTab === "termination" && terminationsQuery.isLoading;
  const terminationError = activeTab === "termination" && terminationsQuery.isError;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Button
          variant="ghost"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(`${basePath}/accounting`)}
          className="cursor-pointer shrink-0"
        />
        <div className={styles.pageHeader} style={{ flex: 1, paddingBottom: 0 }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {t("accountantPayments.title")}
            </h2>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {t("accountantPayments.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          gap: "2rem",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          className="cursor-pointer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1rem",
            border: "none",
            background: "transparent",
            borderBottom:
              activeTab === "payroll"
                ? "2px solid var(--color-primary-600)"
                : "2px solid transparent",
            color:
              activeTab === "payroll"
                ? "var(--color-primary-600)"
                : "var(--color-text-secondary)",
            fontWeight: activeTab === "payroll" ? 600 : 500,
          }}
        >
          <BarChart2 size={18} />
          {t("accountantPayments.tabs.payroll")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("termination")}
          className="cursor-pointer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1rem",
            border: "none",
            background: "transparent",
            borderBottom:
              activeTab === "termination"
                ? "2px solid var(--color-primary-600)"
                : "2px solid transparent",
            color:
              activeTab === "termination"
                ? "var(--color-primary-600)"
                : "var(--color-text-secondary)",
            fontWeight: activeTab === "termination" ? 600 : 500,
          }}
        >
          <List size={18} />
          {t("accountantPayments.tabs.termination")}
        </button>
      </div>

      {activeTab === "payroll" ? (
        <>
          {payrollLoading && <Spinner />}
          {payrollError && (
            <ResourceLoadError
              error={dashboardQuery.error}
              title={t("accountantPayments.payroll.loadFailed")}
              onGoBack={() => navigate(`${basePath}/accounting`)}
              onRefresh={() => dashboardQuery.refetch()}
            />
          )}
          {!payrollLoading && !payrollError && (
            <>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  marginTop: "0.25rem",
                }}
              >
                {t("accountantPayments.payroll.periodsTitle")}
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
                          {t("accountantPayments.payroll.colPeriodName")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {t("accountantPayments.payroll.colStatus")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {t("accountantPayments.payroll.colEmployees")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          {t("accountantPayments.payroll.colTotalNet")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          {t("accountantPayments.payroll.colActions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              padding: "1.5rem",
                              color: "var(--color-text-secondary)",
                              textAlign: "center",
                            }}
                          >
                            {t("accountantPayments.payroll.noPeriods")}
                          </td>
                        </tr>
                      ) : (
                        periodRows.map((period) => {
                          const badgeStyles = getStatusBadgeStyles(period.status);
                          const statusLabel = getPayrollStatusLabel(period.status, t);
                          return (
                            <tr
                              key={period.id}
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                              }}
                            >
                              <td
                                style={{
                                  padding: "1rem 1.5rem",
                                  fontWeight: 500,
                                }}
                              >
                                {period.name}
                              </td>
                              <td style={{ padding: "1rem 1rem" }}>
                                <span
                                  style={{
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "1rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    ...badgeStyles,
                                  }}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td style={{ padding: "1rem 1rem" }}>
                                {period.employeesPaid}
                              </td>
                              <td
                                style={{
                                  padding: "1rem 1rem",
                                  textAlign: "right",
                                  fontWeight: 600,
                                }}
                              >
                                {formatMoneyAmount(
                                  period.totalNet,
                                  period.currency,
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "1rem 1rem",
                                  textAlign: "right",
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    navigate(
                                      `${basePath}/accounting/accountant-payments/payroll/${period.id}`,
                                    )
                                  }
                                >
                                  {t("accountantPayments.payroll.viewDetails")}
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      ) : (
        <>
          {terminationLoading && <Spinner />}
          {terminationError && (
            <ResourceLoadError
              error={terminationsQuery.error}
              title={t("accountantPayments.termination.loadFailed")}
              onGoBack={() => navigate(`${basePath}/accounting`)}
              onRefresh={() => terminationsQuery.refetch()}
            />
          )}
          {!terminationLoading && !terminationError && (
            <>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  marginTop: "0.25rem",
                }}
              >
                {t("accountantPayments.termination.title")}
              </h3>
              <Card className="padding-none">
                <div className="overflow-x-auto">
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.9rem",
                      minWidth: "820px",
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
                          {t("accountantPayments.termination.colEmployee")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {t("accountantPayments.termination.colTerminationType")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {t("accountantPayments.termination.colDate")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          {t("accountantPayments.termination.colNetPayable")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {t("accountantPayments.termination.colStatus")}
                        </th>
                        <th
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--color-text-secondary)",
                            fontWeight: 600,
                            textAlign: "right",
                          }}
                        >
                          {t("accountantPayments.termination.colActions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {terminationRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              padding: "1.5rem",
                              color: "var(--color-text-secondary)",
                              textAlign: "center",
                            }}
                          >
                            {t("accountantPayments.termination.noRows")}
                          </td>
                        </tr>
                      ) : (
                        terminationRows.map((row) => {
                          const statusText = String(row?.status ?? "");
                          const normalizedStatus = statusText.toLowerCase();
                          const isPaid = normalizedStatus === "paid";
                          const badgeStyles = getStatusBadgeStyles(
                            isPaid ? "paid" : "partially_paid",
                          );
                          return (
                            <tr
                              key={row?.id ?? row?.employee_id}
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                              }}
                            >
                              <td style={{ padding: "1rem 1rem", fontWeight: 500 }}>
                                {row?.employee_name ?? "—"}
                              </td>
                              <td style={{ padding: "1rem 1rem" }}>
                                {row?.termination_type ?? "—"}
                              </td>
                              <td style={{ padding: "1rem 1rem" }}>
                                {formatDate(row?.date)}
                              </td>
                              <td
                                style={{
                                  padding: "1rem 1rem",
                                  textAlign: "right",
                                  fontWeight: 600,
                                }}
                              >
                                {formatMoneyAmount(row?.net_payable, "USD")}
                              </td>
                              <td style={{ padding: "1rem 1rem" }}>
                                <span
                                  style={{
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "1rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    ...badgeStyles,
                                  }}
                                >
                                  {statusText || "—"}
                                </span>
                              </td>
                              <td style={{ padding: "1rem 1rem", textAlign: "right" }}>
                                {!isPaid ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    onClick={() => setTerminationToPay(row)}
                                  >
                                    {t("accountantPayments.termination.pay")}
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
            </>
          )}
          {terminationToPay ? (
            <TerminationPayModal
              key={terminationToPay?.id ?? terminationToPay?.employee_id ?? "term-pay"}
              row={terminationToPay}
              onClose={() => setTerminationToPay(null)}
              onPaid={() => terminationsQuery.refetch()}
            />
          ) : null}
        </>
      )}
    </div>
  );
};

export default AccountantPaymentsPage;
