import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import Spinner from "@/core/Spinner";
import { AlertCircle } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";

const BankAccountsTab = () => {
  const { t } = useTranslation(["auditor", "common"]);
  const { periodId } = useParams();
  const { bankAccounts, isPending, isError, error } = useBankAccounts(periodId);

  if (isPending) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="padding-lg">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-error)" }}>
          <AlertCircle size={18} />
          <span>{error?.message || t("bankTab.loadError")}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="padding-none">
      <div
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h4 style={{ fontWeight: 700 }}>
          {t("bankTab.title", { count: bankAccounts.length })}
        </h4>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
          padding: "1rem",
        }}
      >
        {bankAccounts.map((bank) => (
          <div
            key={bank.id}
            style={{
              padding: "1rem",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.25rem",
              }}
            >
              <h4 style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {bank.name}
              </h4>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: bank.is_active
                    ? "var(--color-success-dim)"
                    : "var(--color-error-dim)",
                  color: bank.is_active
                    ? "var(--color-success)"
                    : "var(--color-error)",
                }}
              >
                {bank.is_active ? t("common:status.active") : t("common:status.inactive")}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginBottom: "0.15rem",
              }}
            >
              {bank.bank_name} — {bank.account_type_display}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginBottom: "0.5rem",
                fontFamily: "monospace",
              }}
            >
              {bank.account_number}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <div
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-primary-600)",
                }}
              >
                {Number(bank.current_balance).toLocaleString()} {bank.currency_code}
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("bankTab.open")} {Number(bank.opening_balance).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {bankAccounts.length === 0 && (
          <p
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            {t("bankTab.empty")}
          </p>
        )}
      </div>
    </Card>
  );
};

export default BankAccountsTab;
