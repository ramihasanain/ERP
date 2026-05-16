import { useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import {
  FileText,
  BookOpen,
  Receipt,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
} from "lucide-react";

const getStatusConfig = (t) => ({
  draft: {
    label: t("changeRequests.draft"),
    bg: "var(--color-slate-100)",
    color: "var(--color-text-secondary)",
  },
  submitted: {
    label: t("changeRequests.submitted"),
    bg: "var(--color-warning-dim)",
    color: "var(--color-warning)",
  },
  approved: {
    label: t("changeRequests.approved"),
    bg: "var(--color-success-dim)",
    color: "var(--color-success)",
  },
  rejected: {
    label: t("changeRequests.rejected"),
    bg: "var(--color-error-dim)",
    color: "var(--color-error)",
  },
});

const getAreaConfig = (t) => ({
  journal_entry: { label: t("changeRequests.journalEntry"), icon: BookOpen },
  account: { label: t("changeRequests.account"), icon: FileText },
  invoice: { label: t("changeRequests.invoice"), icon: Receipt },
});

const getActionConfig = (t) => ({
  create: { label: t("changeRequests.create"), icon: Plus, color: "var(--color-success)" },
  update: { label: t("changeRequests.update"), icon: Pencil, color: "var(--color-primary-600)" },
  delete: { label: t("changeRequests.delete"), icon: Trash2, color: "var(--color-error)" },
});

const formatDate = (iso, fallback = "—") => {
  if (!iso) return fallback;
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso, fallback = "—") => {
  if (!iso) return fallback;
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SummaryCards = ({ summary }) => {
  const { t } = useTranslation(["auditor", "common"]);
  const items = [
    {
      key: "draft",
      label: t("changeRequests.draft"),
      color: "var(--color-text-secondary)",
      bg: "var(--color-slate-100)",
    },
    {
      key: "submitted",
      label: t("changeRequests.submitted"),
      color: "var(--color-warning)",
      bg: "var(--color-warning-dim)",
    },
    {
      key: "approved",
      label: t("changeRequests.approved"),
      color: "var(--color-success)",
      bg: "var(--color-success-dim)",
    },
    {
      key: "rejected",
      label: t("changeRequests.rejected"),
      color: "var(--color-error)",
      bg: "var(--color-error-dim)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {items.map((item) => (
        <div
          key={item.key}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: item.bg,
            border: `1px solid ${item.color}20`,
          }}
        >
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: item.color,
              lineHeight: 1.2,
            }}
          >
            {summary[item.key] ?? 0}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: item.color,
              marginTop: "0.15rem",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const PayloadPreview = ({ area, action, original, proposed }) => {
  const { t } = useTranslation(["auditor", "common"]);
  const notAvailable = t("common:notAvailable");
  if (area === "journal_entry" && proposed) {
    const lines = proposed.lines || [];
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
            marginBottom: "0.5rem",
          }}
        >
          {proposed.date && (
            <span>
              {t("changeRequests.date")} <strong>{proposed.date}</strong>
            </span>
          )}
          {proposed.reference && (
            <span>
              {t("changeRequests.ref")} <strong>{proposed.reference}</strong>
            </span>
          )}
          {proposed.currency && (
            <span>
              {t("changeRequests.currency")} <strong>{proposed.currency}</strong>
            </span>
          )}
        </div>
        {proposed.description && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            {proposed.description}
          </div>
        )}
        {lines.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.75rem",
              }}
            >
              <thead>
                <tr style={{ background: "var(--color-slate-50)" }}>
                  <th style={{ padding: "4px 8px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "4px 8px", textAlign: "left" }}>
                    {t("journalTab.description")}
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>
                    {t("journalTab.debit")}
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>
                    {t("journalTab.credit")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr
                    key={i}
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <td
                      style={{
                        padding: "4px 8px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {(line.order ?? i) + 1}
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      {line.description || notAvailable}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        color:
                          Number(line.debit) > 0
                            ? "var(--color-success)"
                            : "var(--color-text-muted)",
                      }}
                    >
                      {Number(line.debit) > 0
                        ? Number(line.debit).toLocaleString()
                        : notAvailable}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        color:
                          Number(line.credit) > 0
                            ? "var(--color-error)"
                            : "var(--color-text-muted)",
                      }}
                    >
                      {Number(line.credit) > 0
                        ? Number(line.credit).toLocaleString()
                        : notAvailable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (area === "account") {
    if (action === "update" && original && proposed) {
      const changedKeys = Object.keys(proposed);
      return (
        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              marginBottom: "0.35rem",
              textTransform: "uppercase",
            }}
          >
            {t("changeRequests.changes")}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            {changedKeys.map((key) => (
              <div
                key={key}
                style={{
                  fontSize: "0.75rem",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, minWidth: 80 }}>{key}:</span>
                <span
                  style={{
                    color: "var(--color-error)",
                    textDecoration: "line-through",
                  }}
                >
                  {String(original[key] ?? notAvailable)}
                </span>
                <span style={{ color: "var(--color-text-muted)" }}>&rarr;</span>
                <span
                  style={{ color: "var(--color-success)", fontWeight: 600 }}
                >
                  {String(proposed[key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (action === "create" && proposed) {
      return (
        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.25rem 1rem",
              fontSize: "0.75rem",
            }}
          >
            {proposed.code && (
              <span>
                {t("changeRequests.code")} <strong>{proposed.code}</strong>
              </span>
            )}
            {proposed.name && (
              <span>
                {t("changeRequests.name")} <strong>{proposed.name}</strong>
              </span>
            )}
            {proposed.description && (
              <span>
                {t("changeRequests.description")} <strong>{proposed.description}</strong>
              </span>
            )}
          </div>
        </div>
      );
    }
  }

  if (area === "invoice" && proposed) {
    return (
      <div style={{ marginTop: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
          }}
        >
          {proposed.invoice_date && (
            <span>
              {t("changeRequests.invoiceDate")} <strong>{proposed.invoice_date}</strong>
            </span>
          )}
          {proposed.due_date && (
            <span>
              {t("changeRequests.dueDate")} <strong>{proposed.due_date}</strong>
            </span>
          )}
          {proposed.notes && (
            <span>
              {t("changeRequests.notes")} <strong>{proposed.notes}</strong>
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const ChangeRequestCard = ({ cr, onDeleteDraft, isDeleting }) => {
  const { t } = useTranslation(["auditor", "common"]);
  const notAvailable = t("common:notAvailable");
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDraft = cr.status === "draft";
  const statusConfig = getStatusConfig(t);
  const areaConfig = getAreaConfig(t);
  const actionConfig = getActionConfig(t);
  const sc = statusConfig[cr.status] || statusConfig.draft;
  const area = areaConfig[cr.target_area] || {
    label: cr.target_area,
    icon: FileText,
  };
  const action = actionConfig[cr.action] || actionConfig.create;
  const AreaIcon = area.icon;
  const ActionIcon = action.icon;

  const handleDelete = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    onDeleteDraft?.(cr.id, () => setConfirmOpen(false));
  };

  return (
    <div
      style={{
        borderRadius: "10px",
        border: "1px solid var(--color-border)",
        background: "var(--color-bg-surface, white)",
        overflow: "hidden",
        transition: "box-shadow 0.15s ease",
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "0.75rem 1rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "8px",
            background: `${action.color}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ActionIcon size={16} style={{ color: action.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
              {cr.title}
            </span>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "5px",
                background: sc.bg,
                color: sc.color,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {sc.label}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginTop: "0.2rem",
              fontSize: "0.72rem",
              color: "var(--color-text-muted)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <AreaIcon size={11} />
              {area.label}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Clock size={11} />
              {formatDate(cr.created_at, notAvailable)}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <User size={11} />
              {cr.auditor_name || notAvailable}
            </span>
          </div>
        </div>

        {isDraft && onDeleteDraft && (
          <button
            onClick={handleDelete}
            title={t("changeRequests.deleteDraft")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "6px",
              border: "1px solid var(--color-error)",
              background: "transparent",
              color: "var(--color-error)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Trash2 size={14} />
          </button>
        )}

        {expanded ? (
          <ChevronUp
            size={16}
            style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
          />
        ) : (
          <ChevronDown
            size={16}
            style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
          />
        )}
      </div>

      {expanded && (
        <div
          style={{
            padding: "0 1rem 0.75rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div style={{ paddingTop: "0.75rem" }}>
            {cr.description && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                {cr.description}
              </p>
            )}

            <PayloadPreview
              area={cr.target_area}
              action={cr.action}
              original={cr.original_payload}
              proposed={cr.proposed_payload}
            />

            {cr.auditor_note && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  background: "var(--color-slate-50)",
                  fontSize: "0.78rem",
                }}
              >
                <strong>{t("changeRequests.auditorNote")}</strong> {cr.auditor_note}
              </div>
            )}

            {cr.admin_note && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  background:
                    cr.status === "approved"
                      ? "var(--color-success-dim)"
                      : cr.status === "rejected"
                        ? "var(--color-error-dim)"
                        : "var(--color-slate-50)",
                  fontSize: "0.78rem",
                }}
              >
                <strong>{t("changeRequests.adminResponse")}</strong> {cr.admin_note}
                {cr.admin_reviewer_name && (
                  <span
                    style={{
                      color: "var(--color-text-muted)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    — {cr.admin_reviewer_name}
                  </span>
                )}
                {cr.reviewed_at && (
                  <span
                    style={{
                      float: "right",
                      color: "var(--color-text-muted)",
                      fontSize: "0.7rem",
                    }}
                  >
                    {formatDateTime(cr.reviewed_at)}
                  </span>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                gap: "1rem",
                fontSize: "0.7rem",
                color: "var(--color-text-muted)",
                flexWrap: "wrap",
              }}
            >
              <span>{t("changeRequests.created")} {formatDateTime(cr.created_at, notAvailable)}</span>
              {cr.submitted_at && (
                <span>{t("changeRequests.submittedAt")} {formatDateTime(cr.submitted_at, notAvailable)}</span>
              )}
              {cr.reviewed_at && (
                <span>{t("changeRequests.reviewed")} {formatDateTime(cr.reviewed_at, notAvailable)}</span>
              )}
              {cr.applied_at && (
                <span>{t("changeRequests.applied")} {formatDateTime(cr.applied_at, notAvailable)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmOpen}
        type="danger"
        title={t("changeRequests.deleteDraftTitle")}
        message={t("changeRequests.deleteDraftMessage", { title: cr.title })}
        confirmText={t("common:actions.delete")}
        cancelText={t("common:actions.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        disabled={isDeleting}
      />
    </div>
  );
};

const ChangeRequestsList = ({
  changeRequests,
  summary,
  onDeleteDraft,
  isDeleting,
}) => {
  const { t } = useTranslation("auditor");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <SummaryCards summary={summary} />

      <Card className="padding-none">
        <div
          style={{
            padding: "0.75rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {changeRequests.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
              }}
            >
              {t("changeRequests.empty")}
            </div>
          ) : (
            changeRequests.map((cr) => (
              <ChangeRequestCard
                key={cr.id}
                cr={cr}
                onDeleteDraft={onDeleteDraft}
                isDeleting={isDeleting}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChangeRequestsList;
