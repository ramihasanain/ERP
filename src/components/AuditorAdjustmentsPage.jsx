import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import Spinner from "@/core/Spinner";
import { useCustomQuery } from "@/hooks/useQuery";
import { useCustomPost } from "@/hooks/useMutation";
import { toast } from "sonner";
import translateApiError from "@/utils/translateApiError";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ArrowRight,
  GitCompare,
  Plus,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";

const QUERY_KEY = "admin-change-requests";

const HIDDEN_PAYLOAD_KEYS = new Set([
  "customer",
  "warehouse",
  "account_type",
  "is_active",
  "order",
]);

const formatFieldLabel = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const filterPayloadKeys = (keys) =>
  keys.filter((key) => !HIDDEN_PAYLOAD_KEYS.has(key));

const actionIcons = {
  create: <Plus size={12} />,
  update: <Pencil size={12} />,
  delete: <Trash2 size={12} />,
};

const formatValue = (val, emptyLabel = "—") => {
  if (val === null || val === undefined) return emptyLabel;
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    return val
      .map((item, i) => {
        if (typeof item === "object") {
          const parts = Object.entries(item)
            .filter(
              ([k, v]) =>
                !HIDDEN_PAYLOAD_KEYS.has(k) &&
                v !== "" &&
                v !== "0.00" &&
                v !== 0,
            )
            .map(([k, v]) => `${formatFieldLabel(k)}: ${v}`);
          return `[${i + 1}] ${parts.join(", ")}`;
        }
        return String(item);
      })
      .join("\n");
  }
  if (typeof val === "object") {
    return Object.entries(val)
      .filter(([k]) => !HIDDEN_PAYLOAD_KEYS.has(k))
      .map(
        ([k, v]) =>
          `${formatFieldLabel(k)}: ${typeof v === "object" ? JSON.stringify(v) : v}`,
      )
      .join("\n");
  }
  return String(val);
};

const formatDate = (dateStr, emptyLabel = "—", locale = "en") => {
  if (!dateStr) return emptyLabel;
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const PayloadComparison = ({ original, proposed, action, t }) => {
  const emptyLabel = t("notAvailable", { ns: "common" });
  const allKeys = useMemo(() => {
    const keys = new Set([
      ...Object.keys(original || {}),
      ...Object.keys(proposed || {}),
    ]);
    return filterPayloadKeys([...keys]);
  }, [original, proposed]);

  if (action === "create") {
    return (
      <div
        style={{
          padding: "0.75rem",
          borderRadius: "10px",
          background: "var(--color-bg-body)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--color-success)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "0.5rem",
          }}
        >
          {t("adminChangeRequests.comparison.proposedValues")}
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
        >
          {allKeys.map((key) => (
            <div
              key={key}
              style={{
                display: "flex",
                gap: "0.75rem",
                fontSize: "0.82rem",
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                background:
                  "color-mix(in srgb, var(--color-success) 10%, var(--color-bg-card))",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  minWidth: "100px",
                }}
              >
                {formatFieldLabel(key)}
              </span>
              <span
                style={{
                  color: "var(--color-success)",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {formatValue(proposed?.[key], emptyLabel)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "0.75rem",
        borderRadius: "10px",
        background: "var(--color-bg-body)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--color-error)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {t("adminChangeRequests.comparison.original")}
        </div>
        <div />
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--color-success)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {t("adminChangeRequests.comparison.proposed")}
        </div>
      </div>
      {allKeys.map((key) => {
        const oldVal = formatValue(original?.[key], emptyLabel);
        const newVal = formatValue(proposed?.[key], emptyLabel);
        const changed = oldVal !== newVal;
        return (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: "0.5rem",
              alignItems: "start",
              marginBottom: "0.35rem",
            }}
          >
            <div
              style={{
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                background: changed
                  ? "color-mix(in srgb, var(--color-error) 12%, var(--color-bg-card))"
                  : "var(--color-bg-card)",
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: "0.15rem",
                }}
              >
                {formatFieldLabel(key)}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  color: changed
                    ? "var(--color-error)"
                    : "var(--color-text-main)",
                  textDecoration: changed ? "line-through" : "none",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {oldVal}
              </div>
            </div>
            <ArrowRight
              size={14}
              style={{
                color: "var(--color-text-muted)",
                marginTop: "1.2rem",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                background: changed
                  ? "color-mix(in srgb, var(--color-success) 12%, var(--color-bg-card))"
                  : "var(--color-bg-card)",
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: "0.15rem",
                }}
              >
                {formatFieldLabel(key)}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  color: changed
                    ? "var(--color-success)"
                    : "var(--color-text-main)",
                  fontWeight: changed ? 700 : 400,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {newVal}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TYPE_KEY_MAP = {
  account: "account",
  journal_entry: "journalEntry",
  journal_line: "journal_line",
  invoice: "invoice",
};

const AuditorAdjustmentsPage = () => {
  const { t, i18n } = useTranslation(["auditor", "common"]);
  const emptyLabel = t("notAvailable", { ns: "common" });
  const formatDateLocalized = useCallback(
    (dateStr) => formatDate(dateStr, emptyLabel, i18n.language),
    [emptyLabel, i18n.language],
  );

  const statusConfig = useMemo(
    () => ({
      submitted: {
        label: t("status.pending", { ns: "common" }),
        icon: <Clock size={14} />,
        bg: "var(--color-warning-dim)",
        color: "var(--color-warning)",
      },
      approved: {
        label: t("status.approved", { ns: "common" }),
        icon: <CheckCircle size={14} />,
        bg: "var(--color-success-dim)",
        color: "var(--color-success)",
      },
      rejected: {
        label: t("status.rejected", { ns: "common" }),
        icon: <XCircle size={14} />,
        bg: "var(--color-error-dim)",
        color: "var(--color-error)",
      },
    }),
    [t],
  );

  const getTypeLabel = useCallback(
    (targetArea) => {
      const mapped = TYPE_KEY_MAP[targetArea];
      if (!mapped) return targetArea;
      if (mapped === "journal_line") {
        return t(`adminChangeRequests.type.${mapped}`);
      }
      return t(`changeRequests.${mapped}`);
    },
    [t],
  );

  const getActionLabel = useCallback(
    (action) => t(`changeRequests.${action}`, { defaultValue: action }),
    [t],
  );

  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("");
  const [adminNotes, setAdminNotes] = useState({});
  const [bulkNote, setBulkNote] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    confirmText: t("actions.confirm", { ns: "common" }),
    onConfirm: null,
  });

  // Build query URL with filters
  const queryParams = new URLSearchParams();
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (periodFilter) queryParams.set("period", periodFilter);
  const paramStr = queryParams.toString();
  const requestUrl = `/api/auditing/change-requests/${paramStr ? `?${paramStr}` : ""}`;

  const {
    data: crData,
    isPending: crLoading,
    isError: crError,
    refetch,
  } = useCustomQuery(requestUrl, [QUERY_KEY, statusFilter, periodFilter]);

  const { data: periodsData } = useCustomQuery(
    "/api/auditing/periods/?min=true",
    ["auditing-periods-min"],
  );

  const changeRequests = useMemo(() => crData?.data ?? [], [crData]);
  const summary = crData?.summary ?? { submitted: 0, approved: 0, rejected: 0 };
  const periods = periodsData ?? [];
  const totalChanges = summary.submitted + summary.approved + summary.rejected;

  const submittedIds = useMemo(
    () =>
      changeRequests.filter((c) => c.status === "submitted").map((c) => c.id),
    [changeRequests],
  );

  // Mutations
  const approveMutation = useCustomPost(
    (data) => `/api/auditing/change-requests/${data.id}/approve/`,
    [QUERY_KEY],
  );

  const rejectMutation = useCustomPost(
    (data) => `/api/auditing/change-requests/${data.id}/reject/`,
    [QUERY_KEY],
  );

  const approveAllMutation = useCustomPost(
    "/api/auditing/change-requests/approve-all/",
    [QUERY_KEY],
  );

  const rejectAllMutation = useCustomPost(
    "/api/auditing/change-requests/reject-all/",
    [QUERY_KEY],
  );

  const closeModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));

  const handleApprove = (change) => {
    const note = adminNotes[change.id] || "";
    setConfirmModal({
      isOpen: true,
      title: t("adminChangeRequests.modals.approveTitle"),
      message: t("adminChangeRequests.modals.approveMessage", {
        title: change.title,
      }),
      type: "success",
      confirmText: t("adminChangeRequests.modals.approve"),
      onConfirm: () => {
        approveMutation.mutate(
          { id: change.id, body: { admin_note: note } },
          {
            onSuccess: () => {
              toast.success(t("adminChangeRequests.toasts.approved"));
              setAdminNotes((prev) => ({ ...prev, [change.id]: "" }));
              refetch();
            },
            onError: (err) =>
              toast.error(
                translateApiError(
                  err,
                  "auditor:adminChangeRequests.toasts.approveFailed",
                ),
              ),
          },
        );
        closeModal();
      },
    });
  };

  const handleReject = (change) => {
    const note = adminNotes[change.id] || "";
    if (!note.trim()) {
      toast.error(t("adminChangeRequests.toasts.rejectionReasonRequired"));
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: t("adminChangeRequests.modals.rejectTitle"),
      message: t("adminChangeRequests.modals.rejectMessage", {
        title: change.title,
      }),
      type: "danger",
      confirmText: t("adminChangeRequests.modals.reject"),
      onConfirm: () => {
        rejectMutation.mutate(
          { id: change.id, body: { admin_note: note } },
          {
            onSuccess: () => {
              toast.success(t("adminChangeRequests.toasts.rejected"));
              setAdminNotes((prev) => ({ ...prev, [change.id]: "" }));
              refetch();
            },
            onError: (err) =>
              toast.error(
                translateApiError(
                  err,
                  "auditor:adminChangeRequests.toasts.rejectFailed",
                ),
              ),
          },
        );
        closeModal();
      },
    });
  };

  const handleApproveAll = () => {
    if (!submittedIds.length) return;
    setBulkNote("");
    setConfirmModal({
      isOpen: true,
      title: t("adminChangeRequests.modals.approveAllTitle"),
      message: t("adminChangeRequests.modals.approveAllMessage", {
        count: submittedIds.length,
      }),
      type: "success",
      confirmText: t("adminChangeRequests.approveAll"),
      onConfirm: () => {
        approveAllMutation.mutate(
          {
            ids: submittedIds,
            admin_note: bulkNote || t("adminChangeRequests.bulkNoteApproved"),
          },
          {
            onSuccess: () => {
              toast.success(
                t("adminChangeRequests.toasts.bulkApproved", {
                  count: submittedIds.length,
                }),
              );
              setBulkNote("");
              refetch();
            },
            onError: (err) =>
              toast.error(
                translateApiError(
                  err,
                  "auditor:adminChangeRequests.toasts.bulkApproveFailed",
                ),
              ),
          },
        );
        closeModal();
      },
    });
  };

  const handleRejectAll = () => {
    if (!submittedIds.length) return;
    setBulkNote("");
    setConfirmModal({
      isOpen: true,
      title: t("adminChangeRequests.modals.rejectAllTitle"),
      message: t("adminChangeRequests.modals.rejectAllMessage", {
        count: submittedIds.length,
      }),
      type: "danger",
      confirmText: t("adminChangeRequests.rejectAll"),
      onConfirm: () => {
        rejectAllMutation.mutate(
          {
            ids: submittedIds,
            admin_note: bulkNote || t("adminChangeRequests.bulkNoteRejected"),
          },
          {
            onSuccess: () => {
              toast.success(
                t("adminChangeRequests.toasts.bulkRejected", {
                  count: submittedIds.length,
                }),
              );
              setBulkNote("");
              refetch();
            },
            onError: (err) =>
              toast.error(
                translateApiError(
                  err,
                  "auditor:adminChangeRequests.toasts.bulkRejectFailed",
                ),
              ),
          },
        );
        closeModal();
      },
    });
  };

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    approveAllMutation.isPending ||
    rejectAllMutation.isPending;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--color-text-main)",
            }}
          >
            <GitCompare size={24} /> {t("adminChangeRequests.title")}
          </h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.85rem",
            }}
          >
            {t("adminChangeRequests.subtitle")}
          </p>
        </div>
        {submittedIds.length > 0 && (
          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            <div
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "10px",
                background: "var(--color-warning-dim)",
                color: "var(--color-warning)",
                fontWeight: 700,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertTriangle size={16} />{" "}
              {t("adminChangeRequests.pendingBadge", {
                count: submittedIds.length,
              })}
            </div>
            <Button
              size="sm"
              style={{ background: "var(--color-success)" }}
              icon={<ThumbsUp size={14} />}
              onClick={handleApproveAll}
              disabled={isMutating}
            >
              {t("adminChangeRequests.approveAll")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{
                borderColor: "var(--color-error)",
                color: "var(--color-error)",
              }}
              icon={<ThumbsDown size={14} />}
              onClick={handleRejectAll}
              disabled={isMutating}
            >
              {t("adminChangeRequests.rejectAll")}
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: t("adminChangeRequests.stats.total"),
            value: totalChanges,
            color: "var(--color-text-secondary)",
          },
          {
            label: t("adminChangeRequests.stats.pending"),
            value: summary.submitted,
            color: "var(--color-warning)",
          },
          {
            label: t("adminChangeRequests.stats.approved"),
            value: summary.approved,
            color: "var(--color-success)",
          },
          {
            label: t("adminChangeRequests.stats.rejected"),
            value: summary.rejected,
            color: "var(--color-error)",
          },
        ].map((s, i) => (
          <Card key={i} className="padding-md">
            <div
              style={{
                fontSize: "0.73rem",
                color: s.color,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--color-text-main)",
              }}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Period filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Calendar size={15} style={{ color: "var(--color-text-muted)" }} />
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-surface)",
              color: "var(--color-text-main)",
              fontSize: "0.82rem",
              cursor: "pointer",
              minWidth: "160px",
            }}
          >
            <option value="">{t("adminChangeRequests.allPeriods")}</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            width: "1px",
            height: "24px",
            background: "var(--color-border)",
          }}
        />

        {/* Status tabs */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { id: "all", label: t("status.all", { ns: "common" }) },
            { id: "submitted", label: t("status.pending", { ns: "common" }) },
            { id: "approved", label: t("status.approved", { ns: "common" }) },
            { id: "rejected", label: t("status.rejected", { ns: "common" }) },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background:
                  statusFilter === tab.id
                    ? "var(--color-primary-600)"
                    : "var(--color-bg-body)",
                color:
                  statusFilter === tab.id
                    ? "#fff"
                    : "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {crLoading && <Spinner size={36} />}
      {crError && (
        <Card className="padding-lg" style={{ textAlign: "center" }}>
          <AlertTriangle
            size={40}
            style={{ color: "var(--color-error)", marginBottom: "0.75rem" }}
          />
          <p style={{ fontWeight: 500, color: "var(--color-text-main)" }}>
            {t("adminChangeRequests.loadError")}
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
              marginBottom: "1rem",
            }}
          >
            {t("adminChangeRequests.loadErrorHint")}
          </p>
          <Button size="sm" onClick={() => refetch()}>
            {t("actions.retry", { ns: "common" })}
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!crLoading && !crError && changeRequests.length === 0 && (
        <Card className="padding-lg" style={{ textAlign: "center" }}>
          <GitCompare
            size={40}
            style={{
              color: "var(--color-text-muted)",
              marginBottom: "0.75rem",
            }}
          />
          <p style={{ fontWeight: 500, color: "var(--color-text-main)" }}>
            {t("adminChangeRequests.emptyTitle")}
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("adminChangeRequests.emptyHint")}
          </p>
        </Card>
      )}

      {/* Change Requests List */}
      {!crLoading && !crError && changeRequests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {changeRequests.map((change) => {
            const sc = statusConfig[change.status] || statusConfig.submitted;
            return (
              <Card
                key={change.id}
                className="padding-none"
                style={{
                  borderLeft: `4px solid ${sc.color}`,
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <div style={{ padding: "1rem 1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.25rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {change.title}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            background: sc.bg,
                            color: sc.color,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.2rem",
                          }}
                        >
                          {sc.icon} {sc.label}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            background:
                              "color-mix(in srgb, var(--color-primary-600) 25%, var(--color-bg-card))",
                            color: "var(--color-primary-400)",
                          }}
                        >
                          {getTypeLabel(change.target_area)}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            background: "var(--color-bg-body)",
                            color: "var(--color-text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          {actionIcons[change.action]}{" "}
                          {getActionLabel(change.action)}
                        </span>
                      </div>
                      {change.description && (
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--color-text-secondary)",
                            margin: "0.25rem 0 0.5rem",
                          }}
                        >
                          {change.description}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          fontSize: "0.73rem",
                          color: "var(--color-text-muted)",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Shield size={11} /> {change.auditor_name}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Clock size={11} />{" "}
                          {formatDateLocalized(change.created_at)}
                        </span>
                        {change.target_object_id && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <FileText size={11} />{" "}
                            {change.target_object_id.slice(0, 8)}…
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auditor Note */}
                  {change.auditor_note && (
                    <div
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        background:
                          "color-mix(in srgb, var(--color-info) 12%, var(--color-bg-card))",
                        fontSize: "0.8rem",
                        color: "var(--color-text-secondary)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <strong style={{ color: "var(--color-info)" }}>
                        {t("adminChangeRequests.auditorNote")}
                      </strong>{" "}
                      {change.auditor_note}
                    </div>
                  )}

                  {/* Payload Comparison */}
                  <PayloadComparison
                    original={change.original_payload}
                    proposed={change.proposed_payload}
                    action={change.action}
                    t={t}
                  />

                  {/* Admin decision note (for reviewed items) */}
                  {change.admin_note && change.status !== "submitted" && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        background:
                          change.status === "approved"
                            ? "var(--color-success-dim)"
                            : "var(--color-error-dim)",
                        fontSize: "0.8rem",
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <span>
                        <strong>
                          {change.admin_reviewer_name ||
                            t("adminChangeRequests.adminLabel")}
                          :
                        </strong>{" "}
                        {change.admin_note}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {t("adminChangeRequests.reviewedAt", {
                          date: formatDateLocalized(change.reviewed_at),
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Approve/Reject actions for submitted items */}
                {change.status === "submitted" && (
                  <div
                    style={{
                      padding: "0.75rem 1.25rem",
                      borderTop: "1px solid var(--color-border)",
                      background: "var(--color-warning-dim)",
                    }}
                  >
                    <textarea
                      value={adminNotes[change.id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [change.id]: e.target.value,
                        }))
                      }
                      placeholder={t(
                        "adminChangeRequests.adminNotesPlaceholder",
                      )}
                      style={{
                        width: "100%",
                        minHeight: "50px",
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.82rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                        marginBottom: "0.5rem",
                        boxSizing: "border-box",
                        background: "var(--color-bg-surface)",
                        color: "var(--color-text-main)",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        variant="outline"
                        style={{
                          borderColor: "var(--color-error)",
                          color: "var(--color-error)",
                        }}
                        icon={<ThumbsDown size={14} />}
                        onClick={() => handleReject(change)}
                        disabled={isMutating}
                      >
                        {t("adminChangeRequests.modals.reject")}
                      </Button>
                      <Button
                        style={{ background: "var(--color-success)" }}
                        icon={<ThumbsUp size={14} />}
                        onClick={() => handleApprove(change)}
                        disabled={isMutating}
                      >
                        {t("adminChangeRequests.modals.approve")}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        disabled={isMutating}
      />
    </div>
  );
};

export default AuditorAdjustmentsPage;
