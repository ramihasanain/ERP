import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import { useAudit } from "@/context/AuditContext";
import { useAuth } from "@/context/AuthContext";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPost } from "@/hooks/useMutation";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import { toast } from "sonner";
import Spinner from "@/core/Spinner";
import NoData from "@/core/NoData";
import {
  Shield,
  LogOut,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  ThumbsDown,
  Building2,
  Users,
  MapPin,
  Phone,
} from "lucide-react";

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const normalizePortalItem = (item) => ({
  id: item?.id || item?.connection_id || "",
  client: item?.client || item?.client_id || "",
  clientName: item?.client_name || item?.company_name || "—",
  auditorFirm: item?.auditor_firm ?? "",
  auditorFirmName: item?.auditor_firm_name || "—",
  industry: item?.industry || "",
  contact: item?.contact || "",
  auditPeriodsCount: item?.audit_periods_count ?? null,
  status: item?.status ?? "",
  requestedByName: item?.requested_by_name || "—",
  requestedByEmail: item?.requested_by_email || "",
  requestNote: item?.request_note || "",
  handledNote: item?.handled_note || "",
  handledAt: item?.handled_at ?? null,
  createdAt: item?.created_at ?? null,
  updatedAt: item?.updated_at ?? null,
});

const normalizePortalItems = (response) =>
  normalizeArrayResponse(response)
    .map(normalizePortalItem)
    .filter((c) => c.id);

const CLIENT_COMPANIES_TABS = [
  {
    id: "pending",
    label: "Pending",
    endpoint: "/api/auditing/portal/requests/",
  },
  {
    id: "approved",
    label: "Approved",
    endpoint: "/api/auditing/portal/companies/",
  },
];

const AuditorDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentAuditor, getAuditorPeriods, AUDIT_STATUSES } = useAudit();
  console.log(currentAuditor);
  const [selectedCompanyId] = useState("all");
  const [companiesTab, setCompaniesTab] = useState("pending");
  const [requestAction, setRequestAction] = useState(null);

  const activeCompaniesTab = CLIENT_COMPANIES_TABS.find(
    (t) => t.id === companiesTab,
  );
  const portalQuery = useCustomQuery(
    activeCompaniesTab.endpoint,
    ["auditing-portal", companiesTab],
    { select: normalizePortalItems },
  );
  const portalItems = portalQuery.data ?? [];

  const acceptMutation = useCustomPost(
    (data) => `/api/auditing/portal/requests/${data.id}/accept/`,
    [
      ["auditing-portal", "pending"],
      ["auditing-portal", "approved"],
    ],
  );
  const rejectMutation = useCustomPost(
    (data) => `/api/auditing/portal/requests/${data.id}/reject/`,
    [["auditing-portal", "pending"]],
  );

  const handleRequestAction = () => {
    if (!requestAction) return;
    const mutation =
      requestAction.type === "accept" ? acceptMutation : rejectMutation;
    const label = requestAction.type === "accept" ? "Approved" : "Rejected";
    mutation.mutate(
      {
        id: requestAction.item.id,
        body: { handled_note: requestAction.note },
      },
      {
        onSuccess: () => {
          toast.success(
            `${requestAction.item.clientName} audit request ${label.toLowerCase()} successfully.`,
          );
          setRequestAction(null);
        },
        onError: () => {
          toast.error(
            `Failed to ${requestAction.type} the request. Please try again.`,
          );
        },
      },
    );
  };

  if (!currentAuditor) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          className="padding-lg"
          style={{ textAlign: "center", maxWidth: "400px" }}
        >
          <Shield
            size={48}
            style={{ color: "var(--color-error)", marginBottom: "1rem" }}
          />
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Access Denied
          </h2>
          <p
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "1rem",
            }}
          >
            Please login through the auditor portal.
          </p>
          <Button onClick={() => navigate("/auditor/login")}>
            Go to Auditor Login
          </Button>
        </Card>
      </div>
    );
  }

  const allPeriods = getAuditorPeriods(currentAuditor.id);
  const periods =
    selectedCompanyId === "all"
      ? allPeriods
      : allPeriods.filter((p) => p.companyId === selectedCompanyId);

  const handleLogout = () => {
    logout();
    navigate("/auditor/login");
  };

  const handleOpenCompanyProfile = (companyId) => {
    navigate(`/auditor/company/${companyId}`);
  };

  // ---- MAIN DASHBOARD ----
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-slate-50)" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
          color: "white",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: "1.25rem" }}>
              Auditor Portal
            </h1>
            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              <Building2 size={12} style={{ verticalAlign: "middle" }} />{" "}
              {currentAuditor.name} — {currentAuditor.fullName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          style={{ color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
          icon={<LogOut size={16} />}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {[
            {
              label: "Pending Review",
              count: periods.filter(
                (p) => p.status === AUDIT_STATUSES.SUBMITTED,
              ).length,
              color: "var(--color-warning)",
            },
            {
              label: "In Review",
              count: periods.filter(
                (p) => p.status === AUDIT_STATUSES.IN_REVIEW,
              ).length,
              color: "var(--color-primary-600)",
            },
            {
              label: "Approved",
              count: periods.filter((p) => p.status === AUDIT_STATUSES.APPROVED)
                .length,
              color: "var(--color-success)",
            },
            {
              label: "Sealed",
              count: periods.filter((p) => p.status === AUDIT_STATUSES.SEALED)
                .length,
              color: "#7c3aed",
            },
          ].map((s, i) => (
            <Card key={i} className="padding-md">
              <div
                style={{ fontSize: "0.75rem", color: s.color, fontWeight: 500 }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>
                {s.count}
              </div>
            </Card>
          ))}
        </div>

        {/* Firm Profile */}
        <Card
          className="padding-md"
          style={{
            marginBottom: "2rem",
            background:
              "linear-gradient(to right, var(--color-primary-50), white)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                {currentAuditor.name}
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {currentAuditor.email}
              </p>
            </div>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "10px",
                fontSize: "0.7rem",
                fontWeight: 700,
                background: "var(--color-success-dim)",
                color: "var(--color-success)",
              }}
            >
              ACTIVE
            </span>
          </div>
        </Card>

        {/* Client Companies */}
        <Card className="padding-lg">
          <h3
            style={{
              fontWeight: 700,
              marginBottom: "1rem",
              fontSize: "1.1rem",
            }}
          >
            Client Companies
          </h3>

          <div
            style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}
          >
            {CLIENT_COMPANIES_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCompaniesTab(tab.id)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background:
                    companiesTab === tab.id
                      ? "var(--color-primary-600)"
                      : "var(--color-bg-body)",
                  color:
                    companiesTab === tab.id
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

          {portalQuery.isLoading && (
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
          {portalQuery.isError && (
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
                Could not load client companies. Please try again later.
              </span>
            </div>
          )}
          {!portalQuery.isLoading &&
            !portalQuery.isError &&
            portalItems.length === 0 && (
              <NoData variant="inline" label="client companies" />
            )}
          {!portalQuery.isLoading &&
            !portalQuery.isError &&
            portalItems.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {portalItems.map((item) => {
                  const statusStyle =
                    item.status === "approved"
                      ? {
                          bg: "var(--color-success-dim)",
                          color: "var(--color-success)",
                          label: "Approved",
                        }
                      : {
                          bg: "var(--color-warning-dim)",
                          color: "var(--color-warning)",
                          label: "Pending",
                        };

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (companiesTab === "approved") {
                          handleOpenCompanyProfile(item.id);
                        }
                      }}
                      style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-subtle)",
                        cursor:
                          companiesTab === "approved" ? "pointer" : "default",
                        transition: "all 0.2s",
                      }}
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
                              {item.clientName}
                            </h4>
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {item.industry || item.requestedByEmail || "—"}
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
                      {companiesTab === "pending" && (
                        <>
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
                            <span>{item.requestedByName}</span>
                          </p>
                          {item.requestNote && (
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
                                {item.requestNote}
                              </span>
                            </p>
                          )}
                          {item.createdAt && (
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
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </p>
                          )}
                        </>
                      )}
                      {companiesTab === "approved" && (
                        <>
                          {item.contact && (
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
                              <Phone
                                size={14}
                                style={{
                                  flexShrink: 0,
                                  color: "var(--color-text-muted)",
                                }}
                              />
                              <span>{item.contact}</span>
                            </p>
                          )}
                          {item.auditPeriodsCount != null && (
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--color-text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.35rem",
                              }}
                            >
                              <FileText size={12} style={{ flexShrink: 0 }} />
                              <span>
                                {item.auditPeriodsCount} audit period
                                {item.auditPeriodsCount !== 1 ? "s" : ""}
                              </span>
                            </p>
                          )}
                        </>
                      )}
                      {companiesTab === "pending" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "0.75rem",
                            paddingTop: "0.75rem",
                            borderTop: "1px solid var(--color-border)",
                          }}
                        >
                          <button
                            onClick={() =>
                              setRequestAction({
                                item,
                                type: "accept",
                                note: "",
                              })
                            }
                            style={{
                              flex: 1,
                              padding: "0.4rem 0.75rem",
                              borderRadius: "8px",
                              border: "none",
                              background: "var(--color-success)",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              setRequestAction({
                                item,
                                type: "reject",
                                note: "",
                              })
                            }
                            style={{
                              flex: 1,
                              padding: "0.4rem 0.75rem",
                              borderRadius: "8px",
                              border: "1px solid var(--color-error)",
                              background: "transparent",
                              color: "var(--color-error)",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <ThumbsDown size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </Card>

        {/* Tip */}
        <Card
          className="padding-md"
          style={{
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: "0.85rem",
          }}
        >
          <Building2
            size={20}
            style={{ marginBottom: "0.5rem", opacity: 0.5 }}
          />
          <p>
            Click on any company card above to view its full profile, accounts,
            tax info, attachments, and audit periods.
          </p>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={!!requestAction}
        type={requestAction?.type === "accept" ? "success" : "danger"}
        title={
          requestAction?.type === "accept"
            ? "Approve Audit Request"
            : "Reject Audit Request"
        }
        message={
          <div>
            <p style={{ marginBottom: "0.75rem" }}>
              {requestAction?.type === "accept"
                ? `Are you sure you want to approve the audit request from "${requestAction?.item?.clientName}"?`
                : `Are you sure you want to reject the audit request from "${requestAction?.item?.clientName}"?`}
            </p>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.35rem",
                color: "var(--color-text-secondary)",
              }}
            >
              Note
            </label>
            <textarea
              value={requestAction?.note ?? ""}
              onChange={(e) =>
                setRequestAction((prev) =>
                  prev ? { ...prev, note: e.target.value } : prev,
                )
              }
              placeholder={
                requestAction?.type === "accept"
                  ? "Optional note for the client..."
                  : "Reason for rejection..."
              }
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "0.6rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        }
        confirmText={requestAction?.type === "accept" ? "Approve" : "Reject"}
        cancelText="Cancel"
        disabled={acceptMutation.isPending || rejectMutation.isPending}
        onConfirm={handleRequestAction}
        onCancel={() => setRequestAction(null)}
      />
    </div>
  );
};

export default AuditorDashboard;
