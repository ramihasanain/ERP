import { useState } from "react";
import { useParams } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Spinner from "@/core/Spinner";
import { AlertCircle } from "lucide-react";
import { useTrialBalance } from "@/hooks/useTrialBalance";

const todayISO = () => new Date().toISOString().slice(0, 10);

const TrialBalanceTab = () => {
  const { periodId } = useParams();
  const [asOf, setAsOf] = useState(todayISO);
  const [includeZeroAccounts, setIncludeZeroAccounts] = useState(false);

  const { accounts, totalDebit, totalCredit, isPending, isError, error, refetch } =
    useTrialBalance(periodId, { asOf, includeZeroAccounts });

  if (isPending) {
    return (
      <Card className="padding-lg" style={{ textAlign: "center" }}>
        <Spinner />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="padding-lg" style={{ textAlign: "center" }}>
        <AlertCircle
          size={32}
          style={{ color: "var(--color-error)", marginBottom: "0.5rem" }}
        />
        <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
          Failed to load trial balance
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            marginBottom: "0.75rem",
          }}
        >
          {error?.message || "An unexpected error occurred"}
        </p>
        <Button size="sm" onClick={refetch}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="padding-none">
      <div
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h4 style={{ fontWeight: 700 }}>
          Trial Balance ({accounts.length})
        </h4>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <label
              htmlFor="tb-as-of"
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              As of:
            </label>
            <input
              id="tb-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              style={{
                padding: "0.3rem 0.5rem",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.8rem",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={includeZeroAccounts}
              onChange={(e) => setIncludeZeroAccounts(e.target.checked)}
              style={{
                cursor: "pointer",
                accentColor: "var(--color-primary-600)",
              }}
            />
            Include zero balances
          </label>
        </div>
      </div>

      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.8rem",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--color-slate-50)",
                position: "sticky",
                top: 0,
              }}
            >
              <th style={{ padding: "8px 12px", textAlign: "left" }}>Code</th>
              <th style={{ padding: "8px 12px", textAlign: "left" }}>Account</th>
              <th style={{ padding: "8px 12px", textAlign: "left" }}>Currency</th>
              <th style={{ padding: "8px 12px", textAlign: "right" }}>Debit</th>
              <th style={{ padding: "8px 12px", textAlign: "right" }}>Credit</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No accounts found
                </td>
              </tr>
            ) : (
              accounts.map((row) => (
                <tr
                  key={row.account_id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td
                    style={{
                      padding: "6px 12px",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                    }}
                  >
                    {row.code}
                  </td>
                  <td style={{ padding: "6px 12px" }}>{row.name}</td>
                  <td
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {row.currency}
                  </td>
                  <td
                    style={{
                      padding: "6px 12px",
                      textAlign: "right",
                      fontFamily: "monospace",
                    }}
                  >
                    {row.debit != null
                      ? Number(row.debit).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </td>
                  <td
                    style={{
                      padding: "6px 12px",
                      textAlign: "right",
                      fontFamily: "monospace",
                    }}
                  >
                    {row.credit != null
                      ? Number(row.credit).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
            <tr
              style={{
                background: "var(--color-primary-50)",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              <td colSpan={3} style={{ padding: "10px 12px" }}>
                Total
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {totalDebit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {totalCredit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TrialBalanceTab;
