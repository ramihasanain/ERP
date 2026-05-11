import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import { useAudit } from "@/context/AuditContext";
import useCustomQuery from "@/hooks/useQuery";
import Spinner from "@/core/Spinner";
import NoData from "@/core/NoData";
import {
  ArrowLeft,
  Send,
  Lock,
  CheckCircle,
  Clock,
  Eye,
  AlertTriangle,
  Download,
  Building2,
  MapPin,
  Users,
  RotateCcw,
  Stamp,
} from "lucide-react";

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

/** API: GET /api/auditing/firms/ — { id, name, license_number, address, is_active, active_auditors } */
const normalizeRegisteredFirm = (item) => {
  const id = item?.id ?? item?.uuid;
  const auditors = Number(item?.active_auditors ?? 0);
  return {
    id: id != null ? String(id) : "",
    name: item?.name || "—",
    licenseNumber:
      item?.license_number ?? item?.licenseNumber ?? item?.license ?? "—",
    address: (item?.address && String(item.address).trim()) || "",
    isActive: Boolean(item?.is_active),
    activeAuditors: Number.isFinite(auditors)
      ? Math.max(0, Math.round(auditors))
      : 0,
  };
};

const normalizeRegisteredFirms = (response) =>
  normalizeArrayResponse(response)
    .map(normalizeRegisteredFirm)
    .filter((f) => f.id);

const AuditManagement = () => {
  const navigate = useNavigate();
  const { auditFirms, auditPeriods, submitForAudit, AUDIT_STATUSES } =
    useAudit();
  const [selectedFirmId, setSelectedFirmId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");

  const registeredFirmsQuery = useCustomQuery(
    "/api/auditing/firms/",
    ["auditing-firms"],
    {
      select: normalizeRegisteredFirms,
    },
  );
  const registeredFirms = registeredFirmsQuery.data ?? [];

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

  const handleSubmit = () => {
    if (!selectedPeriodId || !selectedFirmId) return;
    submitForAudit(selectedPeriodId, selectedFirmId);
    setSelectedPeriodId("");
    setSelectedFirmId("");
  };

  const openPeriods = auditPeriods.filter(
    (p) =>
      p.status === AUDIT_STATUSES.OPEN || p.status === AUDIT_STATUSES.REVISION,
  );
  const activePeriods = auditPeriods.filter((p) =>
    [AUDIT_STATUSES.SUBMITTED, AUDIT_STATUSES.IN_REVIEW].includes(p.status),
  );
  const completedPeriods = auditPeriods.filter((p) =>
    [AUDIT_STATUSES.APPROVED, AUDIT_STATUSES.SEALED].includes(p.status),
  );

  const downloadStatement = (period) => {
    const firm = auditFirms.find((f) => f.id === period.auditorId);
    const content = `
═══════════════════════════════════════════════════════
       ELECTRONICALLY SEALED FINANCIAL STATEMENT
═══════════════════════════════════════════════════════

Period:        ${period.label}
Seal Number:   ${period.sealNumber}
Version:       ${period.version}
Sealed Date:   ${period.sealedAt}
Status:        ${period.status === AUDIT_STATUSES.SEALED ? "SEALED" : "APPROVED"}

───────────────────────────────────────────────────────
AUDITING FIRM
───────────────────────────────────────────────────────
Firm:          ${firm?.name || "Unknown"}
License:       ${firm?.licenseNumber || "N/A"}

───────────────────────────────────────────────────────
AUDITOR'S OPINION
───────────────────────────────────────────────────────
${period.auditorNotes || "No additional notes."}

───────────────────────────────────────────────────────
VERSION HISTORY
───────────────────────────────────────────────────────
${period.versions.map((v) => `  v${v.version} | ${v.sealedAt} | ${v.sealNumber}`).join("\n")}

═══════════════════════════════════════════════════════
This document is electronically sealed and certified.
Digital Seal: ${period.sealNumber}
═══════════════════════════════════════════════════════
        `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sealed_${period.label.replace(/\s/g, "_")}_v${period.version}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
              {openPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}{" "}
                  {p.status === AUDIT_STATUSES.REVISION
                    ? "(Revision needed)"
                    : ""}
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
              {auditFirms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.specialization}
                </option>
              ))}
            </select>
          </div>

          <Button
            icon={<Send size={16} />}
            onClick={handleSubmit}
            disabled={!selectedPeriodId || !selectedFirmId}
          >
            Submit for Audit
          </Button>
        </div>

        {selectedPeriodId && selectedFirmId && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              borderRadius: "8px",
              background: "var(--color-warning-dim)",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
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
        )}
      </Card>

      {/* Audit Firms — list from API */}
      <Card className="padding-lg">
        <h3
          style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1.1rem" }}
        >
          Registered Audit Firms
        </h3>
        {registeredFirmsQuery.isLoading && (
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
        {registeredFirmsQuery.isError && (
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
              Could not load registered firms. Please try again later.
            </span>
          </div>
        )}
        {!registeredFirmsQuery.isLoading &&
          !registeredFirmsQuery.isError &&
          registeredFirms.length === 0 && (
            <NoData variant="inline" label="registered audit firms" />
          )}
        {!registeredFirmsQuery.isLoading &&
          !registeredFirmsQuery.isError &&
          registeredFirms.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
              }}
            >
              {registeredFirms.map((firm) => (
                <div
                  key={firm.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-surface)",
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
                          {firm.name}
                        </h4>
                        <p
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {firm.licenseNumber}
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
                        background: firm.isActive
                          ? "var(--color-success-dim)"
                          : "var(--color-bg-subtle)",
                        color: firm.isActive
                          ? "var(--color-success)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {firm.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {firm.address && (
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
                      <span style={{ lineHeight: 1.35 }}>{firm.address}</span>
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <Users
                      size={14}
                      style={{
                        flexShrink: 0,
                        color: "var(--color-text-muted)",
                      }}
                    />
                    <span>
                      {firm.activeAuditors === 1
                        ? "1 active auditor"
                        : `${firm.activeAuditors} active auditors`}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
      </Card>

      {/* Active Audits */}
      {activePeriods.length > 0 && (
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {activePeriods.map((period) => {
              const sc = statusConfig[period.status];
              const firm = auditFirms.find((f) => f.id === period.auditorId);
              return (
                <div
                  key={period.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--color-bg-subtle)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <Lock size={18} style={{ color: "var(--color-warning)" }} />
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{period.label}</h4>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Auditor: {firm?.name || "Unknown"} • Submitted:{" "}
                        {period.submittedAt}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: sc.bg,
                      color: sc.color,
                    }}
                  >
                    {sc.icon} {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Completed / Sealed */}
      {completedPeriods.length > 0 && (
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {completedPeriods.map((period) => {
              const sc = statusConfig[period.status];
              const firm = auditFirms.find((f) => f.id === period.auditorId);
              return (
                <div
                  key={period.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "10px",
                    border:
                      period.status === AUDIT_STATUSES.SEALED
                        ? "2px solid var(--color-secondary-600)"
                        : "1px solid var(--color-border)",
                    background:
                      period.status === AUDIT_STATUSES.SEALED
                        ? "color-mix(in srgb, var(--color-secondary-600) 16%, var(--color-bg-card))"
                        : "var(--color-bg-surface)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "10px",
                        background: sc.bg,
                        color: sc.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {sc.icon}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700 }}>{period.label}</h4>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {firm?.name} • Seal: {period.sealNumber} • v
                        {period.version}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "8px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.color,
                      }}
                    >
                      {sc.label}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Download size={14} />}
                      onClick={() => downloadStatement(period)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AuditManagement;
