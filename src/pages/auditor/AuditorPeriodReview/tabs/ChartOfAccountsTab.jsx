import { useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Spinner from "@/core/Spinner";
import SelectWithLoadMore from "@/core/SelectWithLoadMore";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import { Plus, Edit3, Trash2, AlertCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  useChartOfAccounts,
  useAccountChangeRequest,
  useAccountTypes,
} from "@/hooks/useChartOfAccounts";

const TYPE_BADGE_STYLES = {
  Asset: { bg: "#dbeafe", color: "#2563eb" },
  Liability: { bg: "#fee2e2", color: "#dc2626" },
  Revenue: { bg: "#d1fae5", color: "#059669" },
  Expense: { bg: "#fef3c7", color: "#d97706" },
  Equity: { bg: "#ede9fe", color: "#7c3aed" },
  COGS: { bg: "#ffedd5", color: "#c2410c" },
};

const getTypeBadge = (type) =>
  TYPE_BADGE_STYLES[type] ?? { bg: "#f1f5f9", color: "#475569" };

const INITIAL_CREATE_FORM = {
  code: "",
  name: "",
  account_type: "",
  description: "",
  order: "",
};

const inputStyle = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  fontSize: "0.9rem",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
  marginBottom: "0.35rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const ChartOfAccountsTab = () => {
  const { t } = useTranslation(["auditor", "common"]);
  const { periodId } = useParams();
  const { setEditModal } = useOutletContext();

  const [includeZeroAccounts, setIncludeZeroAccounts] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { accounts, isPending, isError, error, refetch } = useChartOfAccounts(
    periodId,
    { includeZeroAccounts },
  );

  const { createAccount, updateAccount, deleteAccount, isSubmitting } =
    useAccountChangeRequest(periodId);

  const { accountTypes, isAccountTypesLoading } = useAccountTypes();

  const setField = (key, value) =>
    setCreateForm((prev) => ({ ...prev, [key]: value }));

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.code || !createForm.name || !createForm.account_type) {
      toast.error(t("coaTab.validationRequired"));
      return;
    }
    try {
      await createAccount({
        code: createForm.code,
        name: createForm.name,
        account_type: createForm.account_type,
        description: createForm.description || "",
        is_active: true,
        ...(createForm.order ? { order: Number(createForm.order) } : {}),
      });
      toast.success(t("coaTab.createSuccess"));
      setCreateForm(INITIAL_CREATE_FORM);
      setShowCreateModal(false);
    } catch {
      toast.error(t("coaTab.createFailed"));
    }
  };

  const handleUpdate = (acc) => {
    setEditModal({
      title: t("coaTab.editAccount", { code: acc.code }),
      fields: [
        {
          key: "name",
          label: t("coaTab.accountName"),
          value: acc.name,
          oldValue: acc.name,
          type: "text",
        },
      ],
      onSave: async (vals) => {
        if (!vals.name || vals.name === acc.name) return;
        try {
          await updateAccount(acc.id, vals.name);
          toast.success(t("coaTab.updateSuccess"));
        } catch {
          toast.error(t("coaTab.updateFailed"));
        }
      },
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccount(deleteTarget.id, deleteTarget.name);
      toast.success(t("coaTab.deleteSuccess"));
    } catch {
      toast.error(t("coaTab.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  };

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
          {t("coaTab.loadError")}
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            marginBottom: "0.75rem",
          }}
        >
          {error?.message || t("validation.unexpectedError")}
        </p>
        <Button size="sm" onClick={refetch}>
          {t("common:actions.retry")}
        </Button>
      </Card>
    );
  }

  return (
    <>
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
            {t("coaTab.title", { count: accounts.length })}
          </h4>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
              {t("coaTab.zeroBalanceOnly")}
            </label>

            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowCreateModal(true)}
              disabled={isSubmitting}
            >
              {t("coaTab.addAccount")}
            </Button>
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
                <th style={{ padding: "8px 12px", textAlign: "left" }}>
                  {t("coaTab.code")}
                </th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>
                  {t("coaTab.name")}
                </th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>
                  {t("coaTab.type")}
                </th>
                <th style={{ padding: "8px 12px", textAlign: "center" }}>
                  {t("coaTab.status")}
                </th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>
                  {t("coaTab.balance")}
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    width: "90px",
                  }}
                >
                  {t("coaTab.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t("coaTab.noAccounts")}
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const badge = getTypeBadge(acc.account_type);
                  return (
                    <tr
                      key={acc.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <td
                        style={{
                          padding: "6px 12px",
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                        }}
                      >
                        {acc.code}
                      </td>
                      <td style={{ padding: "6px 12px" }}>{acc.name}</td>
                      <td style={{ padding: "6px 12px" }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {acc.account_type}
                        </span>
                      </td>
                      <td style={{ padding: "6px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: acc.is_active ? "#d1fae5" : "#fee2e2",
                            color: acc.is_active ? "#059669" : "#dc2626",
                          }}
                        >
                          {acc.is_active
                            ? t("common:status.active")
                            : t("common:status.inactive")}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "6px 12px",
                          textAlign: "right",
                          fontWeight: 600,
                          fontFamily: "monospace",
                          fontSize: "0.78rem",
                        }}
                      >
                        {acc.current_balance != null
                          ? `${Number(acc.current_balance).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )} ${acc.current_balance_currency || ""}`
                          : t("common:notAvailable")}
                      </td>
                      <td style={{ padding: "6px 12px", textAlign: "center" }}>
                        {!acc.is_system_account && (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.25rem",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              onClick={() => handleUpdate(acc)}
                              disabled={isSubmitting}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--color-primary-600)",
                                padding: "2px",
                              }}
                              title={t("common:actions.edit")}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(acc)}
                              disabled={isSubmitting}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--color-error)",
                                padding: "2px",
                              }}
                              title={t("common:actions.delete")}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* Create Account Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "520px",
              maxWidth: "95vw",
              maxHeight: "85vh",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
                color: "white",
                flexShrink: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Plus size={18} /> {t("coaTab.addNewAccount")}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>{t("coaTab.accountCode")}</label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setField("code", e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>{t("coaTab.accountName")}</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setField("name", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <SelectWithLoadMore
                  label={t("coaTab.accountType")}
                  value={createForm.account_type}
                  onChange={(val) => setField("account_type", val)}
                  options={accountTypes}
                  emptyOptionLabel={t("periodReview.editModal.select")}
                  isInitialLoading={isAccountTypesLoading}
                  zIndex={10000}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>{t("coaTab.description")}</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) => setField("description", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>{t("coaTab.order")}</label>
                <input
                  type="number"
                  value={createForm.order}
                  onChange={(e) => setField("order", e.target.value)}
                  style={{ ...inputStyle, fontFamily: "monospace" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t("common:actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  icon={<Save size={14} />}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t("coaTab.submitting")
                    : t("periodReview.editModal.saveChanges")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        type="danger"
        title={t("coaTab.deleteAccount")}
        message={
          deleteTarget
            ? t("coaTab.deleteConfirm", {
                code: deleteTarget.code,
                name: deleteTarget.name,
              })
            : ""
        }
        confirmText={t("common:actions.delete")}
        cancelText={t("common:actions.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        disabled={isSubmitting}
      />
    </>
  );
};

export default ChartOfAccountsTab;
