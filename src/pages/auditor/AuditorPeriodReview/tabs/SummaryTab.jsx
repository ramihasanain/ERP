import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import { usePeriodSummary } from "@/hooks/usePeriodSummary";

const SummaryTab = () => {
  const { t } = useTranslation("auditor");
  const { periodId } = useParams();
  const {
    summary: periodSummary,
    quickStats,
    isLoading: summaryLoading,
  } = usePeriodSummary(periodId);

  const totalRevenue = periodSummary?.total_revenue ?? 0;
  const totalExpenses = periodSummary?.total_expenses ?? 0;
  const netIncome = periodSummary?.net_income ?? 0;
  const totalAssets = periodSummary?.total_assets ?? 0;
  const totalLiabilities = periodSummary?.total_liabilities ?? 0;
  const totalEquity = periodSummary?.total_equity ?? 0;

  if (summaryLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "3rem",
          color: "var(--color-text-muted)",
          fontSize: "0.9rem",
        }}
      >
        {t("summaryTab.loading")}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
      >
        {[
          {
            label: t("summaryTab.totalRevenue"),
            value: totalRevenue,
            color: "var(--color-success)",
            bg: "var(--color-success-dim)",
          },
          {
            label: t("summaryTab.totalExpenses"),
            value: totalExpenses,
            color: "var(--color-error)",
            bg: "var(--color-error-dim)",
          },
          {
            label: t("summaryTab.netIncome"),
            value: netIncome,
            color: "var(--color-primary-600)",
            bg: "var(--color-primary-50)",
          },
        ].map((item, i) => (
          <Card key={i} className="padding-md" style={{ background: item.bg }}>
            <div
              style={{
                fontSize: "0.75rem",
                color: item.color,
                fontWeight: 500,
              }}
            >
              {item.label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {item.value.toLocaleString()} JOD
            </div>
          </Card>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
      >
        {[
          { label: t("summaryTab.totalAssets"), value: totalAssets },
          { label: t("summaryTab.totalLiabilities"), value: totalLiabilities },
          { label: t("summaryTab.totalEquity"), value: totalEquity },
        ].map((item, i) => (
          <Card key={i} className="padding-md">
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                fontWeight: 500,
              }}
            >
              {item.label}
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {item.value.toLocaleString()} JOD
            </div>
          </Card>
        ))}
      </div>
      <Card className="padding-md">
        <h4
          style={{
            fontWeight: 600,
            marginBottom: "0.5rem",
            fontSize: "0.85rem",
          }}
        >
          {t("summaryTab.quickStats")}
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            fontSize: "0.8rem",
          }}
        >
          <div>
            <span style={{ color: "var(--color-text-muted)" }}>
              {t("summaryTab.accounts")}
            </span>{" "}
            <strong>{quickStats?.accounts ?? 0}</strong>
          </div>
          <div>
            <span style={{ color: "var(--color-text-muted)" }}>
              {t("summaryTab.journalEntries")}
            </span>{" "}
            <strong>{quickStats?.journal_entries ?? 0}</strong>
          </div>
          <div>
            <span style={{ color: "var(--color-text-muted)" }}>
              {t("summaryTab.invoices")}
            </span>{" "}
            <strong>{quickStats?.invoices ?? 0}</strong>
          </div>
          <div>
            <span style={{ color: "var(--color-text-muted)" }}>
              {t("summaryTab.bankAccounts")}
            </span>{" "}
            <strong>{quickStats?.bank_accounts ?? 0}</strong>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SummaryTab;
