import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import { useAudit } from "@/context/AuditContext";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPost } from "@/hooks/useMutation";
import Spinner from "@/core/Spinner";
import NoData from "@/core/NoData";
import CompanyProfileModal from "@/components/Accounting/CompanyProfileModal";
import {
  ArrowLeft,
  Send,
  Lock,
  CheckCircle,
  Clock,
  Eye,
  AlertTriangle,
  Building2,
  MapPin,
  Users,
  RotateCcw,
  Stamp,
  FileText,
  X,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import styles from "./AuditManagement.module.css";

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const normalizeConnection = (item) => ({
  id: item?.id ?? "",
  auditorFirm: item?.auditor_firm ?? "",
  auditorFirmName: item?.auditor_firm_name || "—",
  status: item?.status ?? "",
  requestedByName: item?.requested_by_name || "—",
  requestedByEmail: item?.requested_by_email || "",
  requestNote: item?.request_note || "",
  handledNote: item?.handled_note || "",
  handledAt: item?.handled_at ?? null,
  createdAt: item?.created_at ?? null,
});

const normalizeConnections = (response) =>
  normalizeArrayResponse(response)
    .map(normalizeConnection)
    .filter((c) => c.id);

const CONNECTION_TABS = [
  { id: "accepted", label: "Accepted" },
  { id: "pending", label: "Pending" },
  { id: "un_registred", label: "Unregistered" },
];

const SubmitAuditModal = ({ isOpen, onClose, periodId, firmId, firmName }) => {
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const submitMutation = useCustomPost(
    `/api/auditing/periods/${periodId}/submit/`,
    ["auditing-active-audits", "auditing-periods-min"],
  );

  const addFiles = (files) => {
    const newItems = Array.from(files).map((file) => ({
      file,
      category: "",
    }));
    setAttachments((prev) => [...prev, ...newItems]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCategory = (index, category) => {
    setAttachments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, category } : item)),
    );
  };

  const handleSubmit = async () => {
    if (!periodId || !firmId) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("auditor_firm", firmId);
      if (note.trim()) formData.append("submitted_note", note.trim());
      attachments.forEach(({ file, category }) => {
        formData.append("attachments", file);
        formData.append("attachment_categories", category);
      });
      await submitMutation.mutateAsync(formData);
      toast.success("Period submitted for audit successfully");
      setNote("");
      setAttachments([]);
      onClose();
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const messages = Object.values(data)
          .flat()
          .filter((m) => typeof m === "string");
        if (messages.length) {
          messages.forEach((msg) => toast.error(msg));
          return;
        }
      }
      toast.error(
        typeof data === "string" ? data : "Failed to submit period for audit",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "10px",
                background: "var(--color-primary-100)",
                color: "var(--color-primary-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                Submit for Audit
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {firmName && `To: ${firmName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "0.35rem",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {/* Warning */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              background: "var(--color-warning-dim)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <AlertTriangle
              size={16}
              style={{ color: "var(--color-warning)", flexShrink: 0 }}
            />
            <span>
              Once submitted, you will <strong>not be able to modify</strong>{" "}
              any accounting entries in this period until the auditor completes
              their review.
            </span>
          </div>

          {/* Note */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
              }}
            >
              Note to Auditor
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Please review January 2025 financials."
              rows={3}
              style={{
                width: "100%",
                padding: "0.625rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-surface)",
                color: "var(--color-text-main)",
                fontSize: "0.85rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Attachments */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <label style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Attachments
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "none",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "0.35rem 0.75rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-primary-600)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Plus size={14} /> Add Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {attachments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "1.5rem",
                  color: "var(--color-text-muted)",
                  fontSize: "0.8rem",
                  border: "2px dashed var(--color-border)",
                  borderRadius: "10px",
                }}
              >
                <Paperclip
                  size={24}
                  style={{ marginBottom: "0.35rem", opacity: 0.4 }}
                />
                <p>No attachments added yet (optional).</p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {attachments.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-subtle)",
                    }}
                  >
                    <Paperclip
                      size={14}
                      style={{
                        flexShrink: 0,
                        color: "var(--color-text-muted)",
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                      }}
                    >
                      {item.file.name}
                    </span>
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => updateCategory(index, e.target.value)}
                      placeholder="Category"
                      style={{
                        padding: "0.3rem 0.5rem",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-surface)",
                        color: "var(--color-text-main)",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        width: "120px",
                        flexShrink: 0,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-error)",
                        padding: "0.2rem",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon={<Send size={16} />}
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={submitting}
          >
            Submit for Audit
          </Button>
        </div>
      </div>
    </div>
  );
};

const AuditManagement = () => {
  const navigate = useNavigate();
  const { AUDIT_STATUSES } = useAudit();
  const [selectedFirmId, setSelectedFirmId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [firmsTab, setFirmsTab] = useState("accepted");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const connectionsQuery = useCustomQuery(
    `/api/auditing/connections/?status=${firmsTab}`,
    ["auditing-connections", firmsTab],
    {
      select: normalizeConnections,
      staleTime: 5 * 60 * 1000,
    },
  );
  const connections = connectionsQuery.data ?? [];

  const acceptedFirmsQuery = useCustomQuery(
    "/api/auditing/connections/?status=accepted",
    ["auditing-connections", "accepted-firms"],
    {
      select: normalizeConnections,
      staleTime: 5 * 60 * 1000,
    },
  );
  const acceptedFirms = acceptedFirmsQuery.data ?? [];

  const periodsQuery = useCustomQuery(
    "/api/auditing/periods/?min=true",
    ["auditing-periods-min"],
    {
      select: normalizeArrayResponse,
      staleTime: 5 * 60 * 1000,
    },
  );
  const periods = periodsQuery.data ?? [];

  const activeAuditsQuery = useCustomQuery(
    "/api/auditing/active-audits/",
    ["auditing-active-audits"],
    { select: normalizeArrayResponse },
  );
  const activeAudits = activeAuditsQuery.data ?? [];

  const statusConfig = {
    [AUDIT_STATUSES.OPEN]: {
      label: "Open",
      color: "var(--color-text-secondary)",
      bg: "var(--color-bg-subtle)",
      icon: <Eye size={14} />,
    },
    [AUDIT_STATUSES.SUBMITTED]: {
      label: "Submitted for Audit",
      color: "var(--color-warning)",
      bg: "var(--color-warning-dim)",
      icon: <Clock size={14} />,
    },
    [AUDIT_STATUSES.IN_REVIEW]: {
      label: "Under Review",
      color: "var(--color-primary-600)",
      bg: "color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))",
      icon: <Eye size={14} />,
    },
    [AUDIT_STATUSES.REVISION]: {
      label: "Revision Needed",
      color: "var(--color-error)",
      bg: "var(--color-error-dim)",
      icon: <RotateCcw size={14} />,
    },
    [AUDIT_STATUSES.APPROVED]: {
      label: "Approved",
      color: "var(--color-success)",
      bg: "var(--color-success-dim)",
      icon: <CheckCircle size={14} />,
    },
    [AUDIT_STATUSES.SEALED]: {
      label: "Sealed ✦",
      color: "var(--color-secondary-400)",
      bg: "color-mix(in srgb, var(--color-secondary-600) 18%, var(--color-bg-card))",
      icon: <Lock size={14} />,
    },
  };

  const sealedStatementsQuery = useCustomQuery(
    "/api/auditing/sealed-statements/",
    ["auditing-sealed-statements"],
    { select: normalizeArrayResponse, staleTime: 5 * 60 * 1000 },
  );
  const sealedStatements = sealedStatementsQuery.data ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Button
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate("/admin/accounting")}
            className="cursor-pointer shrink-0"
          />
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              Audit Management
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              Submit financial periods for external audit and track status.
            </p>
          </div>
        </div>
      </div>

      {/* Submit for Audit */}
      <Card
        className="padding-lg"
        style={{
          border: "2px solid var(--color-border)",
          background:
            "linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 12%, var(--color-bg-card)))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "12px",
              background: "var(--color-primary-100)",
              color: "var(--color-primary-600)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={22} />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              Submit Period for Audit
            </h3>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
              }}
            >
              Select a completed period and assign an audit firm. Once
              submitted, accounts will be locked.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
              }}
            >
              Period
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-surface)",
                color: "var(--color-text-main)",
              }}
            >
              <option value="">Select period...</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
              }}
            >
              Audit Firm
            </label>
            <select
              value={selectedFirmId}
              onChange={(e) => setSelectedFirmId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-surface)",
                color: "var(--color-text-main)",
              }}
            >
              <option value="">Select auditing firm...</option>
              {acceptedFirms.map((f) => (
                <option key={f.id} value={f.auditorFirm}>
                  {f.auditorFirmName}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            icon={<FileText size={16} />}
            onClick={() => setShowProfileModal(true)}
          >
            Company Profile
          </Button>

          <Button
            icon={<Send size={16} />}
            onClick={() => setShowSubmitModal(true)}
            disabled={!selectedPeriodId || !selectedFirmId}
          >
            Submit for Audit
          </Button>
        </div>
      </Card>

      {/* Audit Firms — connections by status */}
      <Card className="padding-lg">
        <h3
          style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1.1rem" }}
        >
          Registered Audit Firms
        </h3>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {CONNECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFirmsTab(tab.id)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background:
                  firmsTab === tab.id
                    ? "var(--color-primary-600)"
                    : "var(--color-bg-body)",
                color:
                  firmsTab === tab.id ? "#fff" : "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {connectionsQuery.isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <Spinner />
          </div>
        )}
        {connectionsQuery.isError && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "var(--color-error-dim)",
              color: "var(--color-error)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>
              Could not load audit firm connections. Please try again later.
            </span>
          </div>
        )}
        {!connectionsQuery.isLoading &&
          !connectionsQuery.isError &&
          connections.length === 0 && (
            <NoData variant="inline" label="audit firm connections" />
          )}
        {!connectionsQuery.isLoading &&
          !connectionsQuery.isError &&
          connections.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
              }}
            >
              {connections.map((conn) => {
                const statusStyle =
                  conn.status === "accepted"
                    ? {
                        bg: "var(--color-success-dim)",
                        color: "var(--color-success)",
                        label: "Accepted",
                      }
                    : conn.status === "pending"
                      ? {
                          bg: "var(--color-warning-dim)",
                          color: "var(--color-warning)",
                          label: "Pending",
                        }
                      : {
                          bg: "var(--color-bg-subtle)",
                          color: "var(--color-text-muted)",
                          label: "Unregistered",
                        };

                return (
                  <div
                    key={conn.id}
                    className={styles.firmCard}
                    onClick={() =>
                      navigate(
                        `/admin/accounting/audit/firms/${conn.auditorFirm}`,
                      )
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.5rem",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            borderRadius: "10px",
                            flexShrink: 0,
                            background:
                              "linear-gradient(135deg, #0f172a, #3b82f6)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Building2 size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                            {conn.auditorFirmName}
                          </h4>
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {conn.requestedByEmail}
                          </p>
                        </div>
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <Users
                        size={14}
                        style={{
                          flexShrink: 0,
                          color: "var(--color-text-muted)",
                        }}
                      />
                      <span>{conn.requestedByName}</span>
                    </p>
                    {conn.requestNote && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-secondary)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.35rem",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <MapPin
                          size={14}
                          style={{
                            flexShrink: 0,
                            marginTop: "1px",
                            color: "var(--color-text-muted)",
                          }}
                        />
                        <span
                          style={{
                            lineHeight: 1.35,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {conn.requestNote}
                        </span>
                      </p>
                    )}
                    {conn.createdAt && (
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <Clock size={12} style={{ flexShrink: 0 }} />
                        <span>
                          {new Date(conn.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </Card>

      {/* Active Audits */}
      <Card className="padding-lg">
        <h3
          style={{
            fontWeight: 700,
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Clock size={18} style={{ color: "var(--color-warning)" }} /> Active
          Audits
        </h3>

        {activeAuditsQuery.isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <Spinner />
          </div>
        )}
        {activeAuditsQuery.isError && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "var(--color-error-dim)",
              color: "var(--color-error)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>Could not load active audits. Please try again later.</span>
          </div>
        )}
        {!activeAuditsQuery.isLoading &&
          !activeAuditsQuery.isError &&
          activeAudits.length === 0 && (
            <NoData variant="inline" label="active audits" />
          )}
        {!activeAuditsQuery.isLoading &&
          !activeAuditsQuery.isError &&
          activeAudits.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {activeAudits.map((audit) => {
                const sc = statusConfig[audit.status] || {
                  label: audit.status_display || audit.status,
                  color: "var(--color-text-secondary)",
                  bg: "var(--color-bg-subtle)",
                  icon: <Clock size={14} />,
                };
                const latestDate = audit.latest_status_at || audit.submitted_at;
                return (
                  <div
                    key={audit.id}
                    style={{
                      padding: "1rem 1.25rem",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-subtle)",
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
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: "10px",
                          flexShrink: 0,
                          background: sc.bg,
                          color: sc.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Lock size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {audit.name}
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem 1.25rem",
                            marginTop: "0.3rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <Building2 size={13} style={{ flexShrink: 0 }} />
                            {audit.auditor_firm_name || "—"}
                          </span>
                          {audit.submitted_at && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <Send size={12} style={{ flexShrink: 0 }} />
                              Submitted{" "}
                              {new Date(
                                audit.submitted_at,
                              ).toLocaleDateString()}
                            </span>
                          )}
                          {latestDate && latestDate !== audit.submitted_at && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <Clock size={12} style={{ flexShrink: 0 }} />
                              Updated{" "}
                              {new Date(latestDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: "4px 14px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.color,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
      </Card>

      {/* Completed / Sealed */}
      <Card className="padding-lg">
        <h3
          style={{
            fontWeight: 700,
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Stamp size={18} style={{ color: "#7c3aed" }} /> Sealed Statements
        </h3>

        {sealedStatementsQuery.isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <Spinner />
          </div>
        )}
        {sealedStatementsQuery.isError && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "var(--color-error-dim)",
              color: "var(--color-error)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>
              Could not load sealed statements. Please try again later.
            </span>
          </div>
        )}
        {!sealedStatementsQuery.isLoading &&
          !sealedStatementsQuery.isError &&
          sealedStatements.length === 0 && (
            <NoData variant="inline" label="sealed statements" />
          )}
        {!sealedStatementsQuery.isLoading &&
          !sealedStatementsQuery.isError &&
          sealedStatements.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {sealedStatements.map((statement) => {
                const sc = statusConfig[statement.status] || {
                  label: statement.status_display || statement.status,
                  color: "var(--color-text-secondary)",
                  bg: "var(--color-bg-subtle)",
                  icon: <Lock size={14} />,
                };
                return (
                  <div
                    key={statement.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "10px",
                      border:
                        statement.status === "sealed"
                          ? "2px solid var(--color-secondary-600)"
                          : "1px solid var(--color-border)",
                      background:
                        statement.status === "sealed"
                          ? "color-mix(in srgb, var(--color-secondary-600) 16%, var(--color-bg-card))"
                          : "var(--color-bg-surface)",
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
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: "10px",
                          flexShrink: 0,
                          background: sc.bg,
                          color: sc.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sc.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {statement.name}
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem 1.25rem",
                            marginTop: "0.3rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <Building2 size={13} style={{ flexShrink: 0 }} />
                            {statement.auditor_firm_name || "—"}
                          </span>
                          {statement.sealed_at && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <Lock size={12} style={{ flexShrink: 0 }} />
                              Sealed{" "}
                              {new Date(
                                statement.sealed_at,
                              ).toLocaleDateString()}
                            </span>
                          )}
                          {statement.approved_by_admin_at && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <CheckCircle
                                size={12}
                                style={{ flexShrink: 0 }}
                              />
                              Approved{" "}
                              {new Date(
                                statement.approved_by_admin_at,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: "4px 14px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.color,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
      </Card>

      <CompanyProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <SubmitAuditModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        periodId={selectedPeriodId}
        firmId={selectedFirmId}
        firmName={
          acceptedFirms.find((f) => f.auditorFirm === selectedFirmId)
            ?.auditorFirmName
        }
      />
    </div>
  );
};

export default AuditManagement;
