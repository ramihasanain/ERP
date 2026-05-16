import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from "react-router-dom";
import { useBasePath } from "@/hooks/useBasePath";
import { toast } from "sonner";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import CompanyProfileModal from "@/components/Accounting/CompanyProfileModal";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPost } from "@/hooks/useMutation";
import Spinner from "@/core/Spinner";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Hash,
  ShieldCheck,
  ShieldOff,
  User,
  BadgeCheck,
  Send,
  LinkIcon,
  Unlink,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";

const CONNECTION_STATUS = {
  accepted: {
    label: "Connectded",
    icon: LinkIcon,
    bg: "var(--color-success-dim)",
    color: "var(--color-success)",
    border: "var(--color-success)",
  },
  pending: {
    label: "Pending Approval",
    icon: Clock,
    bg: "var(--color-warning-dim)",
    color: "var(--color-warning)",
    border: "var(--color-warning)",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    bg: "var(--color-danger-dim, rgba(239,68,68,0.1))",
    color: "var(--color-danger, #ef4444)",
    border: "var(--color-danger, #ef4444)",
  },
  un_registerd: {
    label: "Not Connected",
    icon: Unlink,
    bg: "var(--color-bg-subtle)",
    color: "var(--color-text-muted)",
    border: "var(--color-border)",
  },
};

const ConnectionBadge = ({ status }) => {
  const config = CONNECTION_STATUS[status] ?? CONNECTION_STATUS.un_registerd;
  const Icon = config.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "5px 14px",
        borderRadius: "20px",
        fontSize: "0.78rem",
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        border: `1.5px solid color-mix(in srgb, ${config.border} 30%, transparent)`,
        lineHeight: 1,
      }}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
};

const AuditFirmDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = useBasePath();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [requestNote, setRequestNote] = useState("");

  const {
    data: firm,
    isLoading,
    isError,
  } = useCustomQuery(`/api/auditing/firms/${id}/`, ["auditing-firm", id]);

  const { mutate: requestAudit, isPending } = useCustomPost(
    "/api/auditing/connections/",
  );

  const handleRequestAudit = () => {
    requestAudit(
      { auditor_firm: id, request_note: requestNote },
      {
        onSuccess: () => {
          toast.success("Audit request sent. It is now pending firm approval.");
          setShowRequestModal(false);
          setRequestNote("");
        },
        onError: () => {
          toast.error("Failed to send audit request. Please try again.");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
      >
        <Spinner />
      </div>
    );
  }

  if (isError || !firm) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Button
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate(`${basePath}/accounting/audit`)}
            className="cursor-pointer shrink-0"
          />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Firm Details</h1>
        </div>
        <Card className="padding-lg">
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--color-text-secondary)",
            }}
          >
            <Building2
              size={48}
              style={{ marginBottom: "1rem", opacity: 0.4 }}
            />
            <p style={{ fontSize: "1rem", fontWeight: 600 }}>
              Could not load firm details.
            </p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              The firm may not exist or there was a network error.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const auditors = firm.auditor_profiles ?? [];
  const activeCount = auditors.filter((a) => a.is_active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Button
          variant="ghost"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(`${basePath}/accounting/audit`)}
          className="cursor-pointer shrink-0"
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{firm.name}</h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            Audit Firm Profile
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "4px 14px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: firm.is_active
                ? "var(--color-success-dim)"
                : "var(--color-bg-subtle)",
              color: firm.is_active
                ? "var(--color-success)"
                : "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            {firm.is_active ? (
              <ShieldCheck size={14} />
            ) : (
              <ShieldOff size={14} />
            )}
            {firm.is_active ? "Active" : "Inactive"}
          </span>
          <ConnectionBadge status={firm.connection_status} />
          {firm.connection_status === "un_registerd" && firm.company_profile_filled !== false && (
            <Button
              icon={<Send size={16} />}
              onClick={() => setShowRequestModal(true)}
              className="cursor-pointer"
            >
              Request Audit
            </Button>
          )}
        </div>
      </div>

      {firm.company_profile_filled === false && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1.5px solid var(--color-warning)",
            background: "var(--color-warning-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              minWidth: 0,
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: "var(--color-warning)", flexShrink: 0 }}
            />
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                Company profile incomplete
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-text-secondary)",
                  marginTop: "0.15rem",
                }}
              >
                You need to fill in your company information before you can
                request an audit from this firm.
              </p>
            </div>
          </div>
          <Button
            icon={<FileText size={16} />}
            onClick={() => setShowProfileModal(true)}
            className="cursor-pointer"
          >
            Fill Company Profile
          </Button>
        </div>
      )}

      {/* Firm Info Card */}
      <Card
        className="padding-lg"
        style={{
          border: "2px solid var(--color-border)",
          background:
            "linear-gradient(to bottom right, var(--color-bg-card), color-mix(in srgb, var(--color-primary-600) 8%, var(--color-bg-card)))",
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
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0f172a, #3b82f6)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>{firm.name}</h2>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
              }}
            >
              License #{firm.license_number}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <InfoItem
            icon={<Hash size={16} />}
            label="License Number"
            value={firm.license_number}
          />
          <InfoItem
            icon={<Mail size={16} />}
            label="Email"
            value={firm.email}
          />
          <InfoItem
            icon={<Phone size={16} />}
            label="Phone"
            value={firm.phone}
          />
          <InfoItem
            icon={<MapPin size={16} />}
            label="Address"
            value={firm.address}
          />
          <InfoItem
            icon={<Users size={16} />}
            label="Active Auditors"
            value={
              firm.active_auditors === 1
                ? "1 auditor"
                : `${firm.active_auditors} auditors`
            }
          />
        </div>
      </Card>

      {/* Auditor Profiles */}
      <Card className="padding-lg">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
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
            <Users size={18} style={{ color: "var(--color-primary-600)" }} />
            Auditor Profiles
          </h3>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-secondary)",
              fontWeight: 500,
            }}
          >
            {auditors.length} total &middot; {activeCount} active
          </span>
        </div>

        {auditors.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--color-text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No auditors registered under this firm.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {auditors.map((auditor) => (
              <AuditorCard key={auditor.id} auditor={auditor} />
            ))}
          </div>
        )}
      </Card>

      <CompanyProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ConfirmationModal
        disabled={isPending}
        isOpen={showRequestModal}
        type="info"
        title="Request Audit"
        message={
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <p>
              You are about to send an audit request to{" "}
              <strong>{firm.name}</strong>. Add an optional note to describe
              what you need audited.
            </p>
            <textarea
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="e.g. We need an audit for January 2025 and future periods."
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
        }
        confirmText={requestAudit.isPending ? "Sending…" : "Send Request"}
        cancelText="Cancel"
        onConfirm={handleRequestAudit}
        onCancel={() => {
          setShowRequestModal(false);
          setRequestNote("");
        }}
      />
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
    <div
      style={{
        width: "2rem",
        height: "2rem",
        borderRadius: "8px",
        background: "var(--color-bg-subtle)",
        color: "var(--color-primary-600)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "2px",
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "0.15rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.9rem",
          fontWeight: 500,
          color: "var(--color-text-main)",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </p>
    </div>
  </div>
);

const AuditorCard = ({ auditor }) => (
  <div
    style={{
      padding: "1rem",
      borderRadius: "10px",
      border: "1px solid var(--color-border)",
      background: "var(--color-bg-surface)",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "0.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            background: auditor.is_active
              ? "linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))"
              : "var(--color-bg-subtle)",
            color: auditor.is_active ? "white" : "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          {auditor.full_name ? (
            auditor.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          ) : (
            <User size={16} />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <h4 style={{ fontWeight: 700, fontSize: "0.9rem" }}>
            {auditor.full_name}
          </h4>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {auditor.title || "Auditor"}
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
          background: auditor.is_active
            ? "var(--color-success-dim)"
            : "var(--color-bg-subtle)",
          color: auditor.is_active
            ? "var(--color-success)"
            : "var(--color-text-muted)",
        }}
      >
        {auditor.is_active ? "Active" : "Inactive"}
      </span>
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        paddingTop: "0.5rem",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <DetailRow icon={<Mail size={13} />} value={auditor.email} />
      <DetailRow icon={<Phone size={13} />} value={auditor.phone} />
      <DetailRow
        icon={<BadgeCheck size={13} />}
        value={`License: ${auditor.license_number}`}
      />
    </div>
  </div>
);

const DetailRow = ({ icon, value }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.78rem",
      color: "var(--color-text-secondary)",
    }}
  >
    <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
      {icon}
    </span>
    <span
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {value || "—"}
    </span>
  </div>
);

export default AuditFirmDetails;
