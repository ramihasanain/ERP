import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import SelectWithLoadMore from "@/core/SelectWithLoadMore";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useCurrenciesInfiniteQuery } from "@/hooks/useCurrenciesInfiniteQuery";
import { usePeriodAccounts } from "@/hooks/useAccountsInfiniteQuery";
import { toast } from "sonner";
import { BookOpen, Edit3, Plus, Trash2, Save } from "lucide-react";
import NewJournalEntryForm from "./NewJournalEntryForm";

const JournalEntriesTab = () => {
  const { t } = useTranslation(["auditor", "common"]);
  const { periodId } = useParams();

  const {
    journalEntries,
    isPending: jeLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    isSubmitting: jeSubmitting,
  } = useJournalEntries(periodId);

  const currenciesQuery = useCurrenciesInfiniteQuery();
  const accountsQuery = usePeriodAccounts(periodId);

  const currencyOptions = useMemo(() => {
    const out = [];
    const seen = new Set();
    for (const page of currenciesQuery.data?.pages ?? []) {
      for (const item of page?.data ?? []) {
        if (!item?.id || seen.has(item.id)) continue;
        seen.add(item.id);
        out.push({ value: item.code, label: `${item.code} — ${item.name}` });
      }
    }
    return out;
  }, [currenciesQuery.data]);

  const accountOptions = useMemo(() => {
    const list = Array.isArray(accountsQuery.data) ? accountsQuery.data : [];
    return list.map((item) => ({
      value: item.id,
      label: `${item.code} — ${item.name}`,
    }));
  }, [accountsQuery.data]);

  const [showNewJournalForm, setShowNewJournalForm] = useState(false);
  const [editingJeId, setEditingJeId] = useState(null);
  const [editJeLines, setEditJeLines] = useState([]);

  const handleUpdateJe = async (entryId) => {
    const validLines = editJeLines.filter(
      (l) =>
        l.account && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0),
    );
    if (validLines.length === 0) {
      toast.error(t("journalTab.validationLine"));
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
      toast.error(t("journalTab.validationBalance"));
      return;
    }
    try {
      await updateEntry(entryId, {
        lines: validLines.map((l, i) => ({
          account: l.account,
          description: l.description,
          debit: String(parseFloat(l.debit) || 0),
          credit: String(parseFloat(l.credit) || 0),
          order: i,
        })),
      });
      toast.success(t("journalTab.updateSuccess"));
      setEditingJeId(null);
      setEditJeLines([]);
    } catch {
      toast.error(t("journalTab.updateFailed"));
    }
  };

  const handleDeleteJe = async (entry) => {
    if (!confirm(t("journalTab.deleteConfirm", { title: entry.title }))) return;
    try {
      await deleteEntry(entry.id);
      toast.success(t("journalTab.deleteSuccess"));
    } catch {
      toast.error(t("journalTab.deleteFailed"));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Card className="padding-none">
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ fontWeight: 700 }}>
            {t("journalTab.title", { count: journalEntries.length })}
          </h4>
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowNewJournalForm(!showNewJournalForm)}
          >
            {showNewJournalForm ? t("common:actions.cancel") : t("journalTab.newEntry")}
          </Button>
        </div>

        {jeLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3rem",
              color: "var(--color-text-muted)",
              fontSize: "0.9rem",
            }}
          >
            {t("journalTab.loading")}
          </div>
        )}

        {!jeLoading && journalEntries.length === 0 && !showNewJournalForm && (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              color: "var(--color-text-muted)",
            }}
          >
            <BookOpen
              size={40}
              style={{ marginBottom: "0.75rem", opacity: 0.4 }}
            />
            <p style={{ fontWeight: 500 }}>{t("journalTab.empty")}</p>
            <p style={{ fontSize: "0.85rem" }}>{t("journalTab.emptyHint")}</p>
          </div>
        )}

        {!jeLoading && journalEntries.length > 0 && (
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  padding: "0.75rem 1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                      {entry.title}
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.75rem",
                        marginLeft: "0.75rem",
                      }}
                    >
                      {entry.date}
                    </span>
                    {entry.reference && (
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "0.75rem",
                          marginLeft: "0.75rem",
                        }}
                      >
                        {entry.reference}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    {entry.source === "manual" && (
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          background: "#fef3c7",
                          color: "#d97706",
                        }}
                      >
                        {t("journalTab.manual")}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background:
                          entry.status === "posted"
                            ? "var(--color-success-dim)"
                            : "var(--color-warning-dim)",
                        color:
                          entry.status === "posted"
                            ? "var(--color-success)"
                            : "var(--color-warning)",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {entry.status}
                    </span>
                    <button
                      onClick={() => {
                        setEditingJeId(entry.id);
                        setEditJeLines(
                          entry.lines.map((l) => ({
                            account: l.account,
                            account_name: l.account_name,
                            description: l.description,
                            debit: l.debit,
                            credit: l.credit,
                          })),
                        );
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-primary-600)",
                      }}
                      title={t("journalTab.proposeEdit")}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteJe(entry)}
                      disabled={jeSubmitting}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-error)",
                      }}
                      title={t("journalTab.proposeDelete")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-secondary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {entry.description}
                </p>

                {editingJeId === entry.id ? (
                  <div>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.75rem",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "var(--color-slate-50)" }}>
                          <th
                            style={{ padding: "4px 8px", textAlign: "left" }}
                          >
                            {t("journalTab.account")}
                          </th>
                          <th
                            style={{ padding: "4px 8px", textAlign: "left" }}
                          >
                            {t("journalTab.description")}
                          </th>
                          <th
                            style={{
                              padding: "4px 8px",
                              textAlign: "right",
                              width: "120px",
                            }}
                          >
                            {t("journalTab.debit")}
                          </th>
                          <th
                            style={{
                              padding: "4px 8px",
                              textAlign: "right",
                              width: "120px",
                            }}
                          >
                            {t("journalTab.credit")}
                          </th>
                          <th
                            style={{ padding: "4px 8px", width: "40px" }}
                          ></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editJeLines.map((line, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderTop: "1px solid var(--color-border)",
                            }}
                          >
                            <td style={{ padding: "4px 8px" }}>
                              <SelectWithLoadMore
                                id={`je-edit-line-account-${idx}`}
                                value={line.account}
                                onChange={(val) => {
                                  const lines = [...editJeLines];
                                  lines[idx].account = val;
                                  setEditJeLines(lines);
                                }}
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
                                onChange={(e) => {
                                  const lines = [...editJeLines];
                                  lines[idx].description = e.target.value;
                                  setEditJeLines(lines);
                                }}
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
                                onChange={(e) => {
                                  const lines = [...editJeLines];
                                  lines[idx].debit = e.target.value;
                                  setEditJeLines(lines);
                                }}
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
                                onChange={(e) => {
                                  const lines = [...editJeLines];
                                  lines[idx].credit = e.target.value;
                                  setEditJeLines(lines);
                                }}
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
                              {editJeLines.length > 1 && (
                                <button
                                  onClick={() =>
                                    setEditJeLines(
                                      editJeLines.filter((_, i) => i !== idx),
                                    )
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
                          setEditJeLines([
                            ...editJeLines,
                            {
                              account: "",
                              description: "",
                              debit: "0.00",
                              credit: "0.00",
                            },
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
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingJeId(null);
                            setEditJeLines([]);
                          }}
                        >
                          {t("common:actions.cancel")}
                        </Button>
                        <Button
                          size="sm"
                          icon={<Save size={13} />}
                          disabled={jeSubmitting}
                          onClick={() => handleUpdateJe(entry.id)}
                          style={{ background: "var(--color-primary-600)" }}
                        >
                          {jeSubmitting
                            ? t("journalTab.submitting")
                            : t("journalTab.submitUpdate")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.75rem",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "var(--color-slate-50)" }}>
                        <th
                          style={{ padding: "4px 8px", textAlign: "left" }}
                        >
                          {t("journalTab.account")}
                        </th>
                        <th
                          style={{ padding: "4px 8px", textAlign: "left" }}
                        >
                          {t("journalTab.description")}
                        </th>
                        <th
                          style={{ padding: "4px 8px", textAlign: "right" }}
                        >
                          {t("journalTab.debit")}
                        </th>
                        <th
                          style={{ padding: "4px 8px", textAlign: "right" }}
                        >
                          {t("journalTab.credit")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((line) => (
                        <tr
                          key={line.id}
                          style={{
                            borderTop: "1px solid var(--color-border)",
                          }}
                        >
                          <td
                            style={{
                              padding: "4px 8px",
                              fontFamily: "monospace",
                            }}
                          >
                            <span>{line.account_name}</span>
                          </td>
                          <td style={{ padding: "4px 8px" }}>
                            {line.description}
                          </td>
                          <td
                            style={{
                              padding: "4px 8px",
                              textAlign: "right",
                              color:
                                parseFloat(line.debit) > 0
                                  ? "var(--color-success)"
                                  : "var(--color-text-muted)",
                            }}
                          >
                            {parseFloat(line.debit) > 0
                              ? parseFloat(line.debit).toLocaleString()
                              : t("common:notAvailable")}
                          </td>
                          <td
                            style={{
                              padding: "4px 8px",
                              textAlign: "right",
                              color:
                                parseFloat(line.credit) > 0
                                  ? "var(--color-error)"
                                  : "var(--color-text-muted)",
                            }}
                          >
                            {parseFloat(line.credit) > 0
                              ? parseFloat(line.credit).toLocaleString()
                              : t("common:notAvailable")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {showNewJournalForm && (
        <NewJournalEntryForm
          createEntry={createEntry}
          isSubmitting={jeSubmitting}
          currencyOptions={currencyOptions}
          currenciesQuery={currenciesQuery}
          accountOptions={accountOptions}
          accountsQuery={accountsQuery}
          onClose={() => setShowNewJournalForm(false)}
        />
      )}
    </div>
  );
};

export default JournalEntriesTab;
