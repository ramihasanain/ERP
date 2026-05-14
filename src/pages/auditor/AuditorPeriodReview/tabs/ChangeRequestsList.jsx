import { useState } from "react";
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

const statusConfig = {
  draft: {
    label: "Draft",
    bg: "var(--color-slate-100)",
    color: "var(--color-text-secondary)",
  },
  submitted: {
    label: "Submitted",
    bg: "var(--color-warning-dim)",
    color: "var(--color-warning)",
  },
  approved: {
    label: "Approved",
    bg: "var(--color-success-dim)",
    color: "var(--color-success)",
  },
  rejected: {
    label: "Rejected",
    bg: "var(--color-error-dim)",
    color: "var(--color-error)",
  },
};

const areaConfig = {
  journal_entry: { label: "Journal Entry", icon: BookOpen },
  account: { label: "Account", icon: FileText },
  invoice: { label: "Invoice", icon: Receipt },
};

const actionConfig = {
  create: { label: "Create", icon: Plus, color: "var(--color-success)" },
  update: { label: "Update", icon: Pencil, color: "var(--color-primary-600)" },
  delete: { label: "Delete", icon: Trash2, color: "var(--color-error)" },
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
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
  const items = [
    {
      key: "draft",
      label: "Draft",
      color: "var(--color-text-secondary)",
      bg: "var(--color-slate-100)",
    },
    {
      key: "submitted",
      label: "Submitted",
      color: "var(--color-warning)",
      bg: "var(--color-warning-dim)",
    },
    {
      key: "approved",
      label: "Approved",
      color: "var(--color-success)",
      bg: "var(--color-success-dim)",
    },
    {
      key: "rejected",
      label: "Rejected",
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
              Date: <strong>{proposed.date}</strong>
            </span>
          )}
          {proposed.reference && (
            <span>
              Ref: <strong>{proposed.reference}</strong>
            </span>
          )}
          {proposed.currency && (
            <span>
              Currency: <strong>{proposed.currency}</strong>
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
                    Description
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>
                    Debit
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>
                    Credit
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
                      {line.description || "—"}
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
                        : "—"}
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
                        : "—"}
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
            Changes
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
                  {String(original[key] ?? "—")}
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
                Code: <strong>{proposed.code}</strong>
              </span>
            )}
            {proposed.name && (
              <span>
                Name: <strong>{proposed.name}</strong>
              </span>
            )}
            {proposed.description && (
              <span>
                Description: <strong>{proposed.description}</strong>
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
              Invoice Date: <strong>{proposed.invoice_date}</strong>
            </span>
          )}
          {proposed.due_date && (
            <span>
              Due Date: <strong>{proposed.due_date}</strong>
            </span>
          )}
          {proposed.notes && (
            <span>
              Notes: <strong>{proposed.notes}</strong>
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const ChangeRequestCard = ({ cr, onDeleteDraft, isDeleting }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDraft = cr.status === "draft";
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
              {formatDate(cr.created_at)}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <User size={11} />
              {cr.auditor_name || "—"}
            </span>
          </div>
        </div>

        {isDraft && onDeleteDraft && (
          <button
            onClick={handleDelete}
            title="Delete draft"
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
                <strong>Auditor Note:</strong> {cr.auditor_note}
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
                <strong>Admin Response:</strong> {cr.admin_note}
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
              <span>Created: {formatDateTime(cr.created_at)}</span>
              {cr.submitted_at && (
                <span>Submitted: {formatDateTime(cr.submitted_at)}</span>
              )}
              {cr.reviewed_at && (
                <span>Reviewed: {formatDateTime(cr.reviewed_at)}</span>
              )}
              {cr.applied_at && (
                <span>Applied: {formatDateTime(cr.applied_at)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmOpen}
        type="danger"
        title="Delete Draft"
        message={`Are you sure you want to delete "${cr.title}"? This action cannot be undone.`}
        confirmText="Delete"
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
              No change requests found.
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
