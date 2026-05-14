import { useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Outlet,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import { toast } from "sonner";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import { useAudit } from "@/context/AuditContext";
import {
  useChangeRequests,
  useApproveAndSeal,
  useRequestRevision,
} from "@/hooks/useChangeRequests";
import {
  ArrowLeft,
  List,
  BookOpen,
  DollarSign,
  BarChart3,
  Users,
  CreditCard,
  FileText,
  Edit3,
  Save,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const accountingTabs = [
  { id: "summary", label: "Summary", icon: <BarChart3 size={14} /> },
  { id: "coa", label: "Chart of Accounts", icon: <List size={14} /> },
  { id: "journal", label: "Journal Entries", icon: <BookOpen size={14} /> },
  { id: "trial", label: "Trial Balance", icon: <DollarSign size={14} /> },
  { id: "invoices", label: "Invoices", icon: <FileText size={14} /> },
  { id: "bank", label: "Bank Accounts", icon: <CreditCard size={14} /> },
  { id: "customers", label: "Customers & Vendors", icon: <Users size={14} /> },
  { id: "adjustments", label: "Adjustments", icon: <Edit3 size={14} /> },
];

const AuditorPeriodReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId, periodId } = useParams();
  const [searchParams] = useSearchParams();
  const periodName = searchParams.get("name") || `Period #${periodId}`;

  const { currentAuditor, logChange, auditChanges } = useAudit();

  const [reviewNotes, setReviewNotes] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const { changeRequests, summary } = useChangeRequests(periodId);
  const approveAndSeal = useApproveAndSeal(periodId);
  const requestRevision = useRequestRevision(periodId);

  const hasDrafts = summary.draft > 0;
  const hasChangeRequests = changeRequests.length > 0;
  const approvedByAdmin = summary.approved_by_admin !== false;
  const actionsDisabled = hasDrafts || !hasChangeRequests || !approvedByAdmin;

  const basePath = `/auditor/company/${companyId}/period/${periodId}/review`;

  const isBaseRoute =
    location.pathname === basePath || location.pathname === `${basePath}/`;

  const myChanges = auditChanges.filter((c) => c.companyId === companyId);
  const pendingCount = myChanges.filter((c) => c.status === "pending").length;
  const approvedCount = myChanges.filter((c) => c.status === "approved").length;
  const rejectedCount = myChanges.filter((c) => c.status === "rejected").length;

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-slate-50)",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                Review: {periodName}
              </h1>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                {currentAuditor.name} — Full Accounting Review
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button
                variant="ghost"
                onClick={() => navigate(`/auditor/company/${companyId}`)}
              >
                <ArrowLeft size={14} /> Back
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              gap: "0",
              borderBottom: "2px solid var(--color-border)",
              marginBottom: "1.5rem",
              overflowX: "auto",
            }}
          >
            {accountingTabs.map((tab) => (
              <NavLink
                key={tab.id}
                to={`${basePath}/${tab.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                style={({ isActive }) => ({
                  padding: "0.65rem 1.25rem",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: isActive
                    ? "2px solid var(--color-primary-600)"
                    : "2px solid transparent",
                  color: isActive
                    ? "var(--color-primary-600)"
                    : "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "-2px",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                })}
              >
                {tab.icon} {tab.label}
              </NavLink>
            ))}
          </div>

          {isBaseRoute && <Navigate to={`${basePath}/summary${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} replace />}

          {/* Active Tab Content */}
          <Outlet context={{ companyId, periodId, setEditModal, logChange }} />

          {/* My Changes & Admin Feedback */}
          {myChanges.length > 0 && (
            <Card
              className="padding-none"
              style={{
                marginTop: "1.5rem",
                border: "2px solid var(--color-primary-200)",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--color-border)",
                  background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Edit3 size={18} /> My Changes & Admin Feedback
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginTop: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                >
                  {pendingCount > 0 && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "var(--color-warning-dim)",
                        color: "var(--color-warning)",
                        fontWeight: 600,
                      }}
                    >
                      ⏳ {pendingCount} Pending
                    </span>
                  )}
                  {approvedCount > 0 && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "var(--color-success-dim)",
                        color: "var(--color-success)",
                        fontWeight: 600,
                      }}
                    >
                      ✅ {approvedCount} Approved
                    </span>
                  )}
                  {rejectedCount > 0 && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "var(--color-error-dim)",
                        color: "var(--color-error)",
                        fontWeight: 600,
                      }}
                    >
                      ❌ {rejectedCount} Rejected
                    </span>
                  )}
                </div>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {myChanges.map((change) => {
                  const statusStyle =
                    change.status === "approved"
                      ? {
                          bg: "var(--color-success-dim)",
                          color: "var(--color-success)",
                          icon: "✅",
                          label: "Approved",
                        }
                      : change.status === "rejected"
                        ? {
                            bg: "var(--color-error-dim)",
                            color: "var(--color-error)",
                            icon: "❌",
                            label: "Rejected",
                          }
                        : {
                            bg: "var(--color-warning-dim)",
                            color: "var(--color-warning)",
                            icon: "⏳",
                            label: "Pending",
                          };
                  return (
                    <div
                      key={change.id}
                      style={{
                        padding: "0.75rem 1.25rem",
                        borderBottom: "1px solid var(--color-border)",
                        background:
                          change.status === "rejected"
                            ? "#fff5f5"
                            : change.status === "approved"
                              ? "#f0fdf4"
                              : "white",
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{ fontWeight: 700, fontSize: "0.85rem" }}
                          >
                            {change.field}
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {statusStyle.icon} {statusStyle.label}
                          </span>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.55rem",
                              fontWeight: 600,
                              background: "#e0e7ff",
                              color: "#4338ca",
                            }}
                          >
                            {change.entityType}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {change.createdAt}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.8rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            fontFamily: "monospace",
                            textDecoration: "line-through",
                            fontSize: "0.78rem",
                          }}
                        >
                          {change.oldValue}
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          →
                        </span>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "#d1fae5",
                            color: "#064e3b",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                          }}
                        >
                          {change.newValue}
                        </span>
                      </div>
                      {change.adminNotes && change.status !== "pending" && (
                        <div
                          style={{
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            background:
                              change.status === "approved"
                                ? "#d1fae5"
                                : "#fee2e2",
                            fontSize: "0.78rem",
                            marginBottom: "0.5rem",
                            border: `1px solid ${change.status === "approved" ? "#a7f3d0" : "#fecaca"}`,
                          }}
                        >
                          <strong>Admin:</strong> {change.adminNotes}
                          {change.reviewedAt && (
                            <span
                              style={{
                                float: "right",
                                fontSize: "0.65rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {change.reviewedAt}
                            </span>
                          )}
                        </div>
                      )}
                      {change.status === "rejected" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Edit3 size={12} />}
                            onClick={() => {
                              setEditModal({
                                title: `Resubmit: ${change.field}`,
                                fields: [
                                  {
                                    key: "newValue",
                                    label: `New Value for "${change.field}"`,
                                    value: change.newValue,
                                    oldValue: `Rejected: ${change.newValue}`,
                                    type:
                                      typeof change.newValue === "number" ||
                                      !isNaN(Number(change.newValue))
                                        ? "number"
                                        : "text",
                                  },
                                ],
                                onSave: (vals) => {
                                  logChange({
                                    entityType: change.entityType,
                                    entityId: change.entityId,
                                    field: change.field,
                                    oldValue: change.oldValue,
                                    newValue: vals.newValue,
                                    periodId: change.periodId,
                                    companyId: change.companyId,
                                  });
                                },
                              });
                            }}
                          >
                            Edit & Resubmit
                          </Button>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Submit a new revision for admin review
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Auditor Notes & Actions */}
          <Card className="padding-lg" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>
              Auditor's Notes & Opinion
            </h3>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Enter your professional opinion, observations, and recommendations..."
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                resize: "vertical",
                marginBottom: "1rem",
              }}
            />
            {actionsDisabled && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-warning)",
                  fontWeight: 500,
                  textAlign: "right",
                  marginBottom: "0.5rem",
                }}
              >
                {!hasChangeRequests
                  ? "No change requests found for this period."
                  : !approvedByAdmin
                    ? "Admin approval is required before you can approve or request revision."
                    : `${summary.draft} draft change request(s) must be submitted before you can approve or request revision.`}
              </p>
            )}
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
                icon={<ThumbsDown size={16} />}
                disabled={actionsDisabled || requestRevision.isPending || !reviewNotes.trim()}
                onClick={() => setShowRevisionModal(true)}
              >
                {requestRevision.isPending ? "Submitting…" : "Request Revision"}
              </Button>
              <Button
                style={{ background: "var(--color-success)" }}
                icon={<ThumbsUp size={16} />}
                disabled={actionsDisabled || approveAndSeal.isPending}
                onClick={() => setShowApproveModal(true)}
              >
                Approve & Seal
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Request Revision Confirmation */}
      <ConfirmationModal
        isOpen={showRevisionModal}
        title="Request Revision"
        message={`Are you sure you want to request a revision for "${periodName}"? The period will be sent back for corrections.`}
        type="danger"
        confirmText={requestRevision.isPending ? "Submitting…" : "Request Revision"}
        disabled={requestRevision.isPending}
        onCancel={() => setShowRevisionModal(false)}
        onConfirm={() => {
          requestRevision.mutate(
            { notes: reviewNotes.trim() },
            {
              onSuccess: () => {
                toast.success("Revision requested successfully.");
                setShowRevisionModal(false);
                navigate(-1);
              },
              onError: () => {
                toast.error("Failed to request revision. Please try again.");
                setShowRevisionModal(false);
              },
            },
          );
        }}
      />

      {/* Approve & Seal Confirmation */}
      <ConfirmationModal
        isOpen={showApproveModal}
        title="Approve & Seal Period"
        message={`Are you sure you want to approve and seal "${periodName}"? This action is final and cannot be undone.`}
        type="success"
        confirmText={approveAndSeal.isPending ? "Approving…" : "Approve & Seal"}
        disabled={approveAndSeal.isPending}
        onCancel={() => setShowApproveModal(false)}
        onConfirm={() => {
          approveAndSeal.mutate(
            { notes: reviewNotes.trim() },
            {
              onSuccess: () => {
                toast.success("Period approved and sealed successfully.");
                setShowApproveModal(false);
                navigate(-1);
              },
              onError: () => {
                toast.error("Failed to approve and seal. Please try again.");
                setShowApproveModal(false);
              },
            },
          );
        }}
      />

      {/* Edit Modal */}
      {editModal && (
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
          onClick={() => setEditModal(null)}
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
                <Edit3 size={18} /> {editModal.title}
              </h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const vals = {};
                editModal.fields.forEach((f) => {
                  vals[f.key] = document.getElementById(
                    `modal-${f.key}`,
                  ).value;
                });
                editModal.onSave(vals);
                setEditModal(null);
              }}
              style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}
            >
              {editModal.fields.map((f) => (
                <div key={f.key} style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      marginBottom: "0.35rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {f.label}
                  </label>
                  {f.type === "select" ? (
                    <select
                      id={`modal-${f.key}`}
                      defaultValue={f.value}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                        cursor: "pointer",
                        background: "white",
                      }}
                      autoFocus={editModal.fields.indexOf(f) === 0}
                    >
                      <option value="">Select…</option>
                      {(f.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`modal-${f.key}`}
                      type={f.type || "text"}
                      defaultValue={f.value}
                      step={f.type === "number" ? "0.01" : undefined}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.9rem",
                        fontFamily:
                          f.type === "number" ? "monospace" : "inherit",
                        boxSizing: "border-box",
                      }}
                      autoFocus={editModal.fields.indexOf(f) === 0}
                    />
                  )}
                  {f.oldValue !== undefined && (
                    <div
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Current: <strong>{f.oldValue}</strong>
                    </div>
                  )}
                </div>
              ))}
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
                  onClick={() => setEditModal(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" icon={<Save size={14} />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AuditorPeriodReview;
