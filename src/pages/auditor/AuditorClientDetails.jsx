import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Spinner from "@/core/Spinner";
import useCustomQuery from "@/hooks/useQuery";
import {
  Building2,
  ArrowLeft,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
  Hash,
  FileCheck,
  CreditCard,
  PieChart,
  Paperclip,
  Download,
  FileText,
  Shield,
  Users,
  Clock,
  Eye,
  RotateCcw,
  CheckCircle,
  Lock,
  Edit3,
  AlertTriangle,
} from "lucide-react";

const COMPANY_PROFILE_TABS = [
  { id: "overview", label: "Overview", icon: <Building2 size={14} /> },
  { id: "tax", label: "Tax & Registration", icon: <FileCheck size={14} /> },
  { id: "bank", label: "Bank Accounts", icon: <CreditCard size={14} /> },
  { id: "shareholders", label: "Shareholders", icon: <PieChart size={14} /> },
  { id: "attachments", label: "Attachments", icon: <Paperclip size={14} /> },
  { id: "periods", label: "Audit Periods", icon: <FileText size={14} /> },
];

const PERIOD_STATUS_MAP = {
  submitted: {
    label: "Submitted",
    color: "var(--color-warning)",
    bg: "var(--color-warning-dim)",
    icon: <Clock size={14} />,
  },
  in_review: {
    label: "In Review",
    color: "var(--color-primary-600)",
    bg: "var(--color-primary-50)",
    icon: <Eye size={14} />,
  },
  revision: {
    label: "Revision Requested",
    color: "var(--color-error)",
    bg: "var(--color-error-dim)",
    icon: <RotateCcw size={14} />,
  },
  approved: {
    label: "Approved",
    color: "var(--color-success)",
    bg: "var(--color-success-dim)",
    icon: <CheckCircle size={14} />,
  },
  sealed: {
    label: "Sealed",
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: <Lock size={14} />,
  },
};

const CAT_COLORS = {
  legal: "#2563eb",
  tax: "#d97706",
  financial: "#059669",
  corporate: "#7c3aed",
};

const AuditorClientDetails = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const companyDetailQuery = useCustomQuery(
    `/api/auditing/portal/companies/${companyId}/`,
    ["auditing-portal-company", companyId],
    { enabled: !!companyId },
  );
  const d = companyDetailQuery.data;
  const co = d?.company;
  const overview = d?.overview;
  const taxReg = d?.tax_registration;
  const banks = d?.bank_accounts || [];
  const holders = d?.shareholders || [];
  const attachments = d?.attachments || [];
  const periods_api = d?.audit_periods || [];
  const currency = co?.base_currency || "USD";
  const totalBankBalance = banks.reduce(
    (s, b) => s + (Number(b.current_balance) || 0),
    0,
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-slate-50)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => navigate("/auditor/dashboard")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
          </div>
        </div>

        {companyDetailQuery.isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "4rem",
            }}
          >
            <Spinner />
          </div>
        )}

        {companyDetailQuery.isError && (
          <Card className="padding-lg" style={{ textAlign: "center" }}>
            <AlertTriangle
              size={40}
              style={{
                color: "var(--color-error)",
                marginBottom: "0.75rem",
              }}
            />
            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
              Failed to load company details
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
              }}
            >
              Please try again later.
            </p>
          </Card>
        )}

        {d && (
          <>
            {/* Company Header Card */}
            <Card
              className="padding-lg"
              style={{
                marginBottom: "1.5rem",
                background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
                color: "white",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                    }}
                  >
                    {co?.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <h1
                      style={{
                        fontWeight: 800,
                        fontSize: "1.5rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {co?.name}
                    </h1>
                    <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                      {co?.industry}
                      {overview?.company_information?.legal_form &&
                        ` • ${overview.company_information.legal_form}`}
                    </p>
                    <p style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                      {overview?.contact_details?.ceo &&
                        `CEO: ${overview.contact_details.ceo}`}
                      {overview?.company_information?.registration &&
                        ` | Reg: ${overview.company_information.registration}`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: "rgba(52,211,153,0.2)",
                      color: "#34d399",
                    }}
                  >
                    {currency}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "1rem",
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {[
                  {
                    label: "Bank Accounts",
                    value: banks.length,
                  },
                  {
                    label: "Total Bank Balance",
                    value: `${totalBankBalance.toLocaleString()} ${currency}`,
                  },
                  { label: "Audit Periods", value: periods_api.length },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        opacity: 0.6,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        marginTop: "0.25rem",
                      }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "0",
                borderBottom: "2px solid var(--color-border)",
                marginBottom: "1.5rem",
                overflowX: "auto",
              }}
            >
              {COMPANY_PROFILE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderBottom:
                      activeTab === tab.id
                        ? "2px solid var(--color-primary-600)"
                        : "2px solid transparent",
                    color:
                      activeTab === tab.id
                        ? "var(--color-primary-600)"
                        : "var(--color-text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginBottom: "-2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: Overview */}
            {activeTab === "overview" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                }}
              >
                <Card className="padding-lg">
                  <h4
                    style={{
                      fontWeight: 700,
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Building2 size={16} /> Company Information
                  </h4>
                  {[
                    {
                      icon: <Briefcase size={14} />,
                      label: "Industry",
                      value: overview?.company_information?.industry,
                    },
                    {
                      icon: <Hash size={14} />,
                      label: "Registration",
                      value: overview?.company_information?.registration,
                    },
                    {
                      icon: <Hash size={14} />,
                      label: "Legal Form",
                      value: overview?.company_information?.legal_form,
                    },
                    {
                      icon: <MapPin size={14} />,
                      label: "Address",
                      value: overview?.company_information?.address,
                    },
                    {
                      icon: <Globe size={14} />,
                      label: "Website",
                      value: overview?.company_information?.website,
                      isLink: true,
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--color-border)",
                        fontSize: "0.82rem",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {row.icon} {row.label}
                      </span>
                      <span
                        style={{
                          fontWeight: 500,
                          textAlign: "right",
                          maxWidth: "60%",
                        }}
                      >
                        {row.isLink && row.value ? (
                          <a
                            href={row.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-primary-600)" }}
                          >
                            {row.value}
                          </a>
                        ) : (
                          row.value || "—"
                        )}
                      </span>
                    </div>
                  ))}
                </Card>
                <Card className="padding-lg">
                  <h4
                    style={{
                      fontWeight: 700,
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Users size={16} /> Contact Details
                  </h4>
                  {[
                    {
                      icon: <Users size={14} />,
                      label: "CEO",
                      value: overview?.contact_details?.ceo,
                    },
                    {
                      icon: <Users size={14} />,
                      label: "Contact Person",
                      value: overview?.contact_details?.contact_person,
                    },
                    {
                      icon: <Phone size={14} />,
                      label: "Phone",
                      value: overview?.contact_details?.phone,
                    },
                    {
                      icon: <Phone size={14} />,
                      label: "Fax",
                      value: overview?.contact_details?.fax,
                    },
                    {
                      icon: <Mail size={14} />,
                      label: "Email",
                      value: overview?.contact_details?.email,
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--color-border)",
                        fontSize: "0.82rem",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {row.icon} {row.label}
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        {row.value || "—"}
                      </span>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* TAB: Tax & Registration */}
            {activeTab === "tax" && (
              <Card className="padding-lg">
                <h4
                  style={{
                    fontWeight: 700,
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FileCheck size={16} /> Tax & Registration Information
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2rem",
                  }}
                >
                  <div>
                    <h5
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        marginBottom: "0.75rem",
                        color: "var(--color-primary-600)",
                      }}
                    >
                      Tax Numbers
                    </h5>
                    {[
                      {
                        label: "Tax Number",
                        value: taxReg?.tax_numbers?.tax_number,
                      },
                      {
                        label: "Sales Tax Number",
                        value: taxReg?.tax_numbers?.sales_tax_number,
                      },
                      {
                        label: "Income Tax ID",
                        value: taxReg?.tax_numbers?.income_tax_id,
                      },
                      {
                        label: "Tax Office",
                        value: taxReg?.tax_numbers?.tax_office,
                      },
                    ].map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.5rem 0",
                          borderBottom: "1px solid var(--color-border)",
                          fontSize: "0.82rem",
                        }}
                      >
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                          }}
                        >
                          {row.value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h5
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        marginBottom: "0.75rem",
                        color: "var(--color-primary-600)",
                      }}
                    >
                      VAT & Status
                    </h5>
                    {[
                      {
                        label: "VAT Registered",
                        value: taxReg?.vat_status?.vat_registered
                          ? "Yes"
                          : "No",
                      },
                      {
                        label: "VAT Rate",
                        value:
                          taxReg?.vat_status?.vat_rate != null
                            ? `${taxReg.vat_status.vat_rate}%`
                            : "—",
                      },
                      {
                        label: "Last Tax Filing",
                        value: taxReg?.vat_status?.last_tax_filing,
                      },
                      {
                        label: "Tax Status",
                        value: taxReg?.vat_status?.tax_status,
                      },
                    ].map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.5rem 0",
                          borderBottom: "1px solid var(--color-border)",
                          fontSize: "0.82rem",
                        }}
                      >
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              row.label === "Tax Status"
                                ? row.value === "Compliant"
                                  ? "var(--color-success)"
                                  : "var(--color-warning)"
                                : row.label === "VAT Registered"
                                  ? taxReg?.vat_status?.vat_registered
                                    ? "var(--color-success)"
                                    : "var(--color-error)"
                                  : "inherit",
                          }}
                        >
                          {row.value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* TAB: Bank Accounts */}
            {activeTab === "bank" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {banks.length === 0 ? (
                  <Card className="padding-lg" style={{ textAlign: "center" }}>
                    <CreditCard
                      size={40}
                      style={{
                        color: "var(--color-text-muted)",
                        marginBottom: "0.75rem",
                      }}
                    />
                    <p style={{ color: "var(--color-text-muted)" }}>
                      No bank accounts on file.
                    </p>
                  </Card>
                ) : (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: "1rem",
                      }}
                    >
                      {banks.map((bank) => (
                        <Card
                          key={bank.id}
                          className="padding-lg"
                          style={{
                            border: "1px solid var(--color-border)",
                            opacity: bank.is_active ? 1 : 0.6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  fontWeight: 700,
                                  fontSize: "1rem",
                                }}
                              >
                                {bank.bank_name || bank.name}
                              </h4>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: "var(--color-slate-100)",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                {bank.account_type_display}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.35rem",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: "#dbeafe",
                                  color: "#2563eb",
                                  fontWeight: 600,
                                }}
                              >
                                {bank.currency_code}
                              </span>
                              {!bank.is_active && (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    padding: "2px 6px",
                                    borderRadius: "6px",
                                    background: "var(--color-error-dim)",
                                    color: "var(--color-error)",
                                    fontWeight: 600,
                                  }}
                                >
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "1.75rem",
                              fontWeight: 800,
                              color: "var(--color-primary-600)",
                              margin: "0.75rem 0",
                            }}
                          >
                            {Number(bank.current_balance).toLocaleString()}{" "}
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 500,
                              }}
                            >
                              {bank.currency_code}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            <div style={{ marginBottom: "0.25rem" }}>
                              Account:{" "}
                              <strong style={{ fontFamily: "monospace" }}>
                                {bank.account_number}
                              </strong>
                            </div>
                            {bank.account_code && (
                              <div style={{ marginBottom: "0.25rem" }}>
                                GL Code:{" "}
                                <strong style={{ fontFamily: "monospace" }}>
                                  {bank.account_code}
                                </strong>
                              </div>
                            )}
                            <div>
                              Opening Balance:{" "}
                              <strong>
                                {Number(bank.opening_balance).toLocaleString()}{" "}
                                {bank.currency_code}
                              </strong>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <Card
                      className="padding-md"
                      style={{ background: "var(--color-primary-50)" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          Total Balance Across All Accounts
                        </span>
                        <span
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 800,
                            color: "var(--color-primary-600)",
                          }}
                        >
                          {totalBankBalance.toLocaleString()} {currency}
                        </span>
                      </div>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* TAB: Shareholders */}
            {activeTab === "shareholders" && (
              <Card className="padding-lg">
                <h4
                  style={{
                    fontWeight: 700,
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <PieChart size={16} /> Ownership Structure
                </h4>
                {holders.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                      padding: "2rem 0",
                    }}
                  >
                    No shareholder information available.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {holders.map((sh, i) => (
                      <div
                        key={sh.id || i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          padding: "0.75rem",
                          borderRadius: "10px",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <div
                          style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            borderRadius: "50%",
                            background: `hsl(${i * 90}, 60%, 50%)`,
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            flexShrink: 0,
                          }}
                        >
                          {sh.ownership_percentage}%
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            {sh.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {sh.title}
                          </div>
                        </div>
                        <div
                          style={{
                            width: "200px",
                            height: "8px",
                            borderRadius: "4px",
                            background: "var(--color-slate-100)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${sh.ownership_percentage}%`,
                              height: "100%",
                              borderRadius: "4px",
                              background: `hsl(${i * 90}, 60%, 50%)`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* TAB: Attachments */}
            {activeTab === "attachments" && (
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
                    Documents & Attachments ({attachments.length})
                  </h4>
                </div>
                {attachments.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    No attachments uploaded yet.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.82rem",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "var(--color-slate-50)" }}>
                          <th
                            style={{
                              padding: "8px 14px",
                              textAlign: "left",
                            }}
                          >
                            Document Name
                          </th>
                          <th
                            style={{
                              padding: "8px 14px",
                              textAlign: "left",
                            }}
                          >
                            Category
                          </th>
                          <th
                            style={{
                              padding: "8px 14px",
                              textAlign: "left",
                            }}
                          >
                            Period
                          </th>
                          <th
                            style={{
                              padding: "8px 14px",
                              textAlign: "left",
                            }}
                          >
                            Uploaded By
                          </th>
                          <th
                            style={{
                              padding: "8px 14px",
                              textAlign: "left",
                            }}
                          >
                            Date
                          </th>
                          <th
                            style={{
                              padding: "8px 14px",
                              textAlign: "center",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attachments.map((att) => (
                          <tr
                            key={att.id}
                            style={{
                              borderBottom: "1px solid var(--color-border)",
                            }}
                          >
                            <td
                              style={{
                                padding: "8px 14px",
                                fontWeight: 500,
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <Paperclip
                                  size={14}
                                  style={{
                                    color: "var(--color-text-muted)",
                                  }}
                                />{" "}
                                {att.name}
                              </span>
                            </td>
                            <td style={{ padding: "8px 14px" }}>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  textTransform: "capitalize",
                                  background: `${CAT_COLORS[att.category] || "#6b7280"}15`,
                                  color: CAT_COLORS[att.category] || "#6b7280",
                                }}
                              >
                                {att.category}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                fontSize: "0.78rem",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {att.period_name || "—"}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                color: "var(--color-text-muted)",
                                fontSize: "0.78rem",
                              }}
                            >
                              <div>{att.uploaded_by_name}</div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  opacity: 0.7,
                                }}
                              >
                                {att.uploaded_by_email}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {att.created_at
                                ? new Date(att.created_at).toLocaleDateString()
                                : "—"}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                textAlign: "center",
                              }}
                            >
                              <a
                                href={att.file_url || att.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--color-primary-600)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  textDecoration: "none",
                                }}
                              >
                                <Download size={13} /> Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* TAB: Audit Periods */}
            {activeTab === "periods" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {periods_api.length === 0 ? (
                  <Card className="padding-lg" style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--color-text-muted)" }}>
                      No audit periods for this company.
                    </p>
                  </Card>
                ) : (
                  periods_api.map((period) => {
                    const sc =
                      PERIOD_STATUS_MAP[period.status] ||
                      PERIOD_STATUS_MAP.submitted;
                    return (
                      <Card key={period.id} className="padding-md">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
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
                              <h4
                                style={{
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                }}
                              >
                                {period.name}
                              </h4>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginTop: "0.25rem",
                                }}
                              >
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    background: sc.bg,
                                    color: sc.color,
                                  }}
                                >
                                  {sc.label}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--color-text-muted)",
                                  }}
                                >
                                  {period.period_start} — {period.period_end}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "1rem",
                              alignItems: "flex-end",
                            }}
                          >
                            <div
                              style={{
                                textAlign: "right",
                                fontSize: "0.72rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              <div>
                                <Paperclip
                                  size={11}
                                  style={{ verticalAlign: "middle" }}
                                />{" "}
                                {period.attachments_count} attachments
                              </div>
                              {period.submitted_change_requests > 0 && (
                                <div style={{ marginTop: "0.15rem" }}>
                                  <Edit3
                                    size={11}
                                    style={{ verticalAlign: "middle" }}
                                  />{" "}
                                  {period.submitted_change_requests} change
                                  requests
                                </div>
                              )}
                              {period.submitted_at && (
                                <div style={{ marginTop: "0.15rem" }}>
                                  Submitted:{" "}
                                  {new Date(
                                    period.submitted_at,
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            {/* {(period.status === "submitted" || period.status === "in_review") && ( */}
                            <button
                              onClick={() =>
                                navigate(
                                  `/auditor/company/${companyId}/period/${period.id}/review?name=${encodeURIComponent(period.name || "")}`,
                                )
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                padding: "0.4rem 0.85rem",
                                borderRadius: "8px",
                                border: "none",
                                background: "var(--color-primary-600)",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={13} /> Review
                            </button>
                            {/* )} */}
                          </div>
                        </div>
                        {period.auditor_firm_name && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              paddingTop: "0.5rem",
                              borderTop: "1px solid var(--color-border)",
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <Shield size={12} /> Auditor Firm:{" "}
                            <strong>{period.auditor_firm_name}</strong>
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditorClientDetails;
