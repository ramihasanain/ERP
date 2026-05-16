import { useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import SelectWithLoadMore from "@/core/SelectWithLoadMore";
import { toast } from "sonner";
import { Edit3, CheckCircle } from "lucide-react";

const NewJournalEntryForm = ({
  createEntry,
  isSubmitting,
  currencyOptions,
  currenciesQuery,
  accountOptions,
  accountsQuery,
  onClose,
}) => {
  const { t } = useTranslation(["auditor", "common"]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("");
  const [lines, setLines] = useState([
    { account: "", description: "", debit: "", credit: "" },
  ]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setReference("");
    setDate(new Date().toISOString().split("T")[0]);
    setCurrency("");
    setLines([{ account: "", description: "", debit: "", credit: "" }]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error(t("newJournalForm.validationTitle"));
      return;
    }
    const validLines = lines.filter(
      (l) =>
        l.account && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0),
    );
    if (validLines.length === 0) {
      toast.error(t("newJournalForm.validationLine"));
      return;
    }
    const totalDebit = validLines.reduce(
      (s, l) => s + (parseFloat(l.debit) || 0),
      0,
    );
    const totalCredit = validLines.reduce(
      (s, l) => s + (parseFloat(l.credit) || 0),
      0,
    );
    if (totalDebit !== totalCredit) {
      toast.error(t("newJournalForm.validationBalance"));
      return;
    }
    try {
      await createEntry({
        title,
        target_object_id: crypto.randomUUID(),
        proposed_payload: {
          date,
          reference,
          description,
          currency,
          lines: validLines.map((l, i) => ({
            account: l.account,
            description: l.description,
            debit: String(parseFloat(l.debit) || 0),
            credit: String(parseFloat(l.credit) || 0),
            order: i,
          })),
        },
      });
      toast.success(t("newJournalForm.submitSuccess"));
      reset();
    } catch {
      toast.error(t("newJournalForm.submitFailed"));
    }
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx][field] = value;
    setLines(updated);
  };

  const totalDebit = lines.reduce(
    (s, l) => s + (parseFloat(l.debit) || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (s, l) => s + (parseFloat(l.credit) || 0),
    0,
  );

  return (
    <Card
      className="padding-lg"
      style={{
        border: "2px solid var(--color-primary-600)",
        background: "var(--color-primary-50)",
      }}
    >
      <h4
        style={{
          fontWeight: 700,
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Edit3 size={16} /> {t("newJournalForm.title")}
      </h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            {t("newJournalForm.titleLabel")}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("newJournalForm.titlePlaceholder")}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            {t("newJournalForm.reference")}
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t("newJournalForm.referencePlaceholder")}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            {t("newJournalForm.date")}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
            }}
          />
        </div>
        <SelectWithLoadMore
          label={t("newJournalForm.currency")}
          id="je-currency"
          value={currency}
          onChange={(val) => setCurrency(val)}
          options={currencyOptions}
          emptyOptionLabel={
            currenciesQuery.isLoading
              ? t("newJournalForm.loadingCurrencies")
              : t("newJournalForm.selectCurrency")
          }
          disabled={currenciesQuery.isError}
          isInitialLoading={currenciesQuery.isLoading}
          hasMore={currenciesQuery.hasNextPage && !currenciesQuery.isError}
          onLoadMore={() => currenciesQuery.fetchNextPage()}
          isLoadingMore={currenciesQuery.isFetchingNextPage}
          paginationError={
            currenciesQuery.isFetchNextPageError
              ? t("newJournalForm.currenciesLoadMoreError")
              : null
          }
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            display: "block",
            marginBottom: "0.25rem",
          }}
        >
          {t("newJournalForm.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("newJournalForm.descriptionPlaceholder")}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
            fontSize: "0.85rem",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          {t("newJournalForm.lines")}
        </label>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.82rem",
          }}
        >
          <thead>
            <tr style={{ background: "white" }}>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>
                {t("journalTab.account")}
              </th>
              <th style={{ padding: "6px 8px", textAlign: "left" }}>
                {t("journalTab.description")}
              </th>
              <th
                style={{
                  padding: "6px 8px",
                  textAlign: "right",
                  width: "120px",
                }}
              >
                {t("journalTab.debit")}
              </th>
              <th
                style={{
                  padding: "6px 8px",
                  textAlign: "right",
                  width: "120px",
                }}
              >
                {t("journalTab.credit")}
              </th>
              <th style={{ padding: "6px 8px", width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td style={{ padding: "4px 8px" }}>
                  <SelectWithLoadMore
                    id={`je-line-account-${idx}`}
                    value={line.account}
                    onChange={(val) => updateLine(idx, "account", val)}
                    options={accountOptions}
                    emptyOptionLabel={
                      accountsQuery.isPending
                        ? t("journalTab.loadingAccounts")
                        : t("journalTab.selectAccount")
                    }
                    disabled={accountsQuery.isError}
                    isInitialLoading={accountsQuery.isPending}
                    hasMore={false}
                    triggerStyle={{
                      height: "2rem",
                      padding: "0 0.5rem",
                      fontSize: "0.8rem",
                    }}
                  />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <input
                    value={line.description}
                    onChange={(e) =>
                      updateLine(idx, "description", e.target.value)
                    }
                    placeholder={t("newJournalForm.lineDescriptionPlaceholder")}
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--color-border)",
                      fontSize: "0.8rem",
                    }}
                  />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <input
                    type="number"
                    value={line.debit}
                    onChange={(e) =>
                      updateLine(idx, "debit", e.target.value)
                    }
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--color-border)",
                      textAlign: "right",
                      fontSize: "0.8rem",
                    }}
                  />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <input
                    type="number"
                    value={line.credit}
                    onChange={(e) =>
                      updateLine(idx, "credit", e.target.value)
                    }
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--color-border)",
                      textAlign: "right",
                      fontSize: "0.8rem",
                    }}
                  />
                </td>
                <td
                  style={{
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  {lines.length > 1 && (
                    <button
                      onClick={() =>
                        setLines(lines.filter((_, i) => i !== idx))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-error)",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                      }}
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.5rem",
          }}
        >
          <button
            onClick={() =>
              setLines([
                ...lines,
                { account: "", description: "", debit: "", credit: "" },
              ])
            }
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary-600)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {t("journalTab.addLine")}
          </button>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
            }}
          >
            {t("newJournalForm.totalDebit")} <strong>{totalDebit.toLocaleString()}</strong>
            &nbsp;|&nbsp; {t("newJournalForm.totalCredit")}{" "}
            <strong>{totalCredit.toLocaleString()}</strong>
            {totalDebit !== totalCredit && (
              <span
                style={{
                  color: "var(--color-error)",
                  marginLeft: "0.5rem",
                }}
              >
                {t("newJournalForm.unbalanced")}
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "flex-end",
        }}
      >
        <Button variant="ghost" onClick={reset}>
          {t("common:actions.cancel")}
        </Button>
        <Button
          icon={<CheckCircle size={14} />}
          disabled={isSubmitting}
          onClick={handleSubmit}
          style={{ background: "var(--color-primary-600)" }}
        >
          {isSubmitting ? t("newJournalForm.submitting") : t("newJournalForm.submitForApproval")}
        </Button>
      </div>
    </Card>
  );
};

export default NewJournalEntryForm;
