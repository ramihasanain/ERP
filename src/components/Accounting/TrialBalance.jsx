import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useBasePath } from "@/hooks/useBasePath";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Input from "@/components/Shared/Input";
import Spinner from "@/core/Spinner";
import FrontendPagination from "@/core/FrontendPagination";
import useCustomQuery from "@/hooks/useQuery";
import { Download, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const ACCOUNT_PAGE_SIZE = 15;

const selectStyle = {
  width: "100%",
  height: "2.5rem",
  padding: "0 0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-surface)",
  color: "var(--color-text-main)",
  fontSize: "0.875rem",
  fontWeight: 400,
};

const filterFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  minWidth: "180px",
  flex: "1 1 180px",
};

const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "var(--color-text-secondary)",
};

const tableContainerStyle = {
  width: "100%",
  maxWidth: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "720px",
  borderCollapse: "collapse",
  fontSize: "0.9rem",
};

const tableCellStyle = {
  padding: "0.75rem 1rem",
};

const tableAmountCellStyle = {
  ...tableCellStyle,
  textAlign: "right",
};

const totalCellStyle = {
  padding: "1rem",
};

const totalAmountCellStyle = {
  ...totalCellStyle,
  textAlign: "right",
};

const normalizeTrialBalanceResponse = (response) => {
  const payload = response?.data?.accounts ? response.data : response;

  return {
    asOf: payload?.as_of || "",
    isBalanced: Boolean(payload?.is_balanced),
    totalDebit: payload?.total_debit ?? 0,
    totalCredit: payload?.total_credit ?? 0,
    accounts: Array.isArray(payload?.accounts) ? payload.accounts : [],
  };
};

const normalizeAccountTypesResponse = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const formatAmount = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const DATE_LOCALE_MAP = {
  en: "en-US",
  ar: "ar",
  de: "de-DE",
};

const formatDateLabel = (date, language, fallback) => {
  if (!date) return fallback;

  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString(DATE_LOCALE_MAP[language] || undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getTodayIsoDate = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
};

const formatExcelAmount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
};

const downloadExcelFile = ({ filename, sheetName, rows }) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 34 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const TrialBalance = () => {
  const { t, i18n } = useTranslation(["accounting", "common"]);
  const navigate = useNavigate();
  const basePath = useBasePath();
  const [filters, setFilters] = useState({
    asOf: getTodayIsoDate(),
    isActive: "true",
    accountType: "",
    includeZeroAccounts: "false",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const trialBalanceUrl = useMemo(() => {
    const params = new URLSearchParams({
      as_of: filters.asOf,
      is_active: filters.isActive,
      account_type: filters.accountType,
      include_zero_accounts: filters.includeZeroAccounts,
    });

    return `/accounting/trial-balance/?${params.toString()}`;
  }, [filters]);

  const trialBalanceQuery = useCustomQuery(
    trialBalanceUrl,
    ["accounting-trial-balance", filters],
    { select: normalizeTrialBalanceResponse },
  );

  const accountTypesQuery = useCustomQuery(
    "/api/shared/account-types/",
    ["shared-account-types"],
    {
      select: normalizeAccountTypesResponse,
    },
  );

  const trialBalance = trialBalanceQuery.data ?? {
    asOf: filters.asOf,
    isBalanced: false,
    totalDebit: 0,
    totalCredit: 0,
    accounts: [],
  };

  const accountTypes = accountTypesQuery.data ?? [];
  const isBalanceStatusKnown =
    !trialBalanceQuery.isLoading && !trialBalanceQuery.isError;
  const totalAccountPages = Math.max(
    1,
    Math.ceil(trialBalance.accounts.length / ACCOUNT_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalAccountPages);
  const paginatedAccounts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ACCOUNT_PAGE_SIZE;
    return trialBalance.accounts.slice(
      startIndex,
      startIndex + ACCOUNT_PAGE_SIZE,
    );
  }, [safeCurrentPage, trialBalance.accounts]);

  const updateFilter = (field, value) => {
    setCurrentPage(1);
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const handleExportExcel = () => {
    if (trialBalanceQuery.isLoading) {
      toast.error(t("trialBalance.waitLoading"));
      return;
    }

    if (trialBalanceQuery.isError) {
      toast.error(t("trialBalance.exportError"));
      return;
    }

    if (trialBalance.accounts.length === 0) {
      toast.error(t("trialBalance.noAccounts"));
      return;
    }

    const rows = [
      [t("trialBalance.exportSheetTitle")],
      [
        t("trialBalance.asOf", {
          date: formatDateLabel(
            trialBalance.asOf || filters.asOf,
            i18n.language,
            t("trialBalance.selectedDate"),
          ),
        }),
      ],
      [],
      [
        t("trialBalance.colAccountCode"),
        t("trialBalance.colAccountName"),
        t("trialBalance.colCurrency"),
        t("trialBalance.colDebit"),
        t("trialBalance.colCredit"),
      ],
      ...trialBalance.accounts.map((account) => [
        account.code || "-",
        account.name || "-",
        account.currency || "-",
        formatExcelAmount(account.debit),
        formatExcelAmount(account.credit),
      ]),
      [],
      [
        t("trialBalance.total"),
        "",
        "",
        formatExcelAmount(trialBalance.totalDebit),
        formatExcelAmount(trialBalance.totalCredit),
      ],
    ];

    downloadExcelFile({
      filename: `trial_balance_${trialBalance.asOf || filters.asOf || "export"}`,
      sheetName: t("trialBalance.exportSheetName"),
      rows,
    });
    toast.success(t("trialBalance.exportSuccess"));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            minWidth: 0,
          }}
        >
          <Button
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate(`${basePath}/accounting`)}
            className="cursor-pointer shrink-0"
          />
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>
              {t("trialBalance.title")}
            </h1>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {t("trialBalance.asOf", {
                date: formatDateLabel(
                  trialBalance.asOf || filters.asOf,
                  i18n.language,
                  t("trialBalance.selectedDate"),
                ),
              })}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }} className="shrink-0">
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={handleExportExcel}
            disabled={
              trialBalanceQuery.isLoading ||
              trialBalanceQuery.isError ||
              trialBalance.accounts.length === 0
            }
            className="cursor-pointer"
          >
            {t("trialBalance.exportExcel")}
          </Button>
        </div>
      </div>

      <Card className="padding-lg">
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <div style={filterFieldStyle}>
            <label style={labelStyle}>{t("trialBalance.filterAsOf")}</label>
            <Input
              type="date"
              lang="en"
              value={filters.asOf}
              onChange={(event) => updateFilter("asOf", event.target.value)}
            />
          </div>
          <div style={filterFieldStyle}>
            <label style={labelStyle}>{t("trialBalance.filterActiveStatus")}</label>
            <select
              value={filters.isActive}
              onChange={(event) => updateFilter("isActive", event.target.value)}
              style={selectStyle}
              className="cursor-pointer"
            >
              <option value="true">{t("common:status.active")}</option>
              <option value="false">{t("common:status.inactive")}</option>
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={labelStyle}>{t("trialBalance.filterAccountType")}</label>
            <select
              value={filters.accountType}
              onChange={(event) =>
                updateFilter("accountType", event.target.value)
              }
              style={selectStyle}
              className="cursor-pointer"
              disabled={accountTypesQuery.isLoading}
            >
              {accountTypesQuery.isLoading ? (
                <option value={filters.accountType}>
                  {t("trialBalance.loadingAccountTypes")}
                </option>
              ) : accountTypes.length === 0 ? (
                <option value={filters.accountType}>
                  {filters.accountType}
                </option>
              ) : (
                <>
                  <option value="">{t("common.all")}</option>
                  {accountTypes.map((type) => (
                    <option key={type.id || type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={labelStyle}>{t("trialBalance.filterIncludeZero")}</label>
            <select
              value={filters.includeZeroAccounts}
              onChange={(event) =>
                updateFilter("includeZeroAccounts", event.target.value)
              }
              style={selectStyle}
              className="cursor-pointer"
            >
              <option value="true">{t("common:actions.yes")}</option>
              <option value="false">{t("common:actions.no")}</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            color:
              isBalanceStatusKnown && trialBalance.isBalanced
                ? "var(--color-success)"
                : "var(--color-warning)",
            fontWeight: 600,
          }}
        >
          {isBalanceStatusKnown && trialBalance.isBalanced ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {trialBalanceQuery.isLoading
            ? t("trialBalance.loadingBalanceStatus")
            : trialBalanceQuery.isError
              ? t("trialBalance.balanceStatusUnavailable")
              : trialBalance.isBalanced
                ? t("trialBalance.balanced")
                : t("trialBalance.notBalanced")}
        </div>

        {trialBalanceQuery.isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <Spinner />
          </div>
        ) : trialBalanceQuery.isError ? (
          <div style={{ padding: "1rem 0", color: "var(--color-error)" }}>
            {t("trialBalance.loadFailed")}
            <div style={{ marginTop: "1rem" }}>
              <Button
                variant="outline"
                onClick={() => trialBalanceQuery.refetch()}
                className="cursor-pointer"
              >
                {t("common:actions.retry")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid var(--color-border)",
                      textAlign: "left",
                      background: "var(--color-bg-table-header)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <th style={tableCellStyle}>{t("trialBalance.colAccountCode")}</th>
                    <th style={tableCellStyle}>{t("trialBalance.colAccountName")}</th>
                    <th style={tableCellStyle}>{t("trialBalance.colCurrency")}</th>
                    <th style={tableAmountCellStyle}>{t("trialBalance.colDebit")}</th>
                    <th style={tableAmountCellStyle}>{t("trialBalance.colCredit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.accounts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          ...tableCellStyle,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {t("trialBalance.noAccountsForFilters")}
                      </td>
                    </tr>
                  ) : (
                    paginatedAccounts.map((account) => (
                      <tr
                        key={account.account_id || account.code}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <td
                          style={{
                            ...tableCellStyle,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {account.code || "-"}
                        </td>
                        <td style={tableCellStyle}>{account.name || "-"}</td>
                        <td
                          style={{
                            ...tableCellStyle,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {account.currency || "-"}
                        </td>
                        <td style={tableAmountCellStyle}>
                          {formatAmount(account.debit)}
                        </td>
                        <td style={tableAmountCellStyle}>
                          {formatAmount(account.credit)}
                        </td>
                      </tr>
                    ))
                  )}

                  <tr
                    style={{
                      fontWeight: 700,
                      background: "var(--color-bg-table-header)",
                      color: "var(--color-text-main)",
                    }}
                  >
                    <td style={totalCellStyle}></td>
                    <td style={totalCellStyle}>{t("trialBalance.total")}</td>
                    <td style={totalCellStyle}></td>
                    <td style={totalAmountCellStyle}>
                      {formatAmount(trialBalance.totalDebit)}
                    </td>
                    <td style={totalAmountCellStyle}>
                      {formatAmount(trialBalance.totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <FrontendPagination
                currentPage={safeCurrentPage}
                count={trialBalance.accounts.length}
                pageSize={ACCOUNT_PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default TrialBalance;
