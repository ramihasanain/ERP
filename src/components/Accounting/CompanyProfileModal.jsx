import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import Button from "@/components/Shared/Button";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPatch } from "@/hooks/useMutation";
import Spinner from "@/core/Spinner";
import {
  Building2,
  Users,
  AlertTriangle,
  FileCheck,
  PieChart,
  Briefcase,
  Plus,
  Trash2,
  Save,
  X,
  CheckCircle,
} from "lucide-react";

const PROFILE_TABS = [
  { id: "overview", label: "Overview", icon: <Building2 size={14} /> },
  { id: "tax", label: "Tax & Registration", icon: <FileCheck size={14} /> },
  {
    id: "shareholders",
    label: "Shareholders",
    icon: <PieChart size={14} />,
  },
];

const inputStyle = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-surface)",
  color: "var(--color-text-main)",
  fontSize: "0.82rem",
};

const labelStyle = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  marginBottom: "0.3rem",
  color: "var(--color-text-secondary)",
};

const CompanyProfileModal = ({ isOpen, onClose }) => {
  const [profileTab, setProfileTab] = useState("overview");

  const profileQuery = useCustomQuery(
    "/api/auditing/company-profile/",
    ["auditing-company-profile"],
    { enabled: isOpen },
  );

  const patchProfile = useCustomPatch("/api/auditing/company-profile/", [
    "auditing-company-profile",
  ]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isSubmitting, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      legal_form: "",
      registration_number: "",
      address: "",
      website: "",
      ceo_name: "",
      contact_person: "",
      phone: "",
      fax: "",
      email: "",
      tax_number: "",
      sales_tax_number: "",
      income_tax_id: "",
      tax_office: "",
      vat_registered: false,
      vat_rate: "",
      last_tax_filing: "",
      tax_status: "",
      shareholders: [],
    },
  });

  const {
    fields,
    append,
    remove: removeShareholder,
  } = useFieldArray({
    control,
    name: "shareholders",
  });

  const watchedShareholders = watch("shareholders");
  const ownershipTotal = (watchedShareholders || []).reduce(
    (sum, sh) => sum + (parseFloat(sh?.ownership_percentage) || 0),
    0,
  );
  const ownershipValid =
    fields.length === 0 || Math.abs(ownershipTotal - 100) < 0.01;

  useEffect(() => {
    if (profileQuery.data) {
      const d = profileQuery.data;
      reset({
        legal_form: d.legal_form || "",
        registration_number: d.registration_number || "",
        address: d.address || "",
        website: d.website || "",
        ceo_name: d.ceo_name || "",
        contact_person: d.contact_person || "",
        phone: d.phone || "",
        fax: d.fax || "",
        email: d.email || "",
        tax_number: d.tax_number || "",
        sales_tax_number: d.sales_tax_number || "",
        income_tax_id: d.income_tax_id || "",
        tax_office: d.tax_office || "",
        vat_registered: d.vat_registered ?? false,
        vat_rate: d.vat_rate || "",
        last_tax_filing: d.last_tax_filing || "",
        tax_status: d.tax_status || "",
        shareholders: (d.shareholders || []).map((sh, i) => ({
          _sid: sh.id || "",
          name: sh.name || "",
          title: sh.title || "",
          ownership_percentage: sh.ownership_percentage || "",
          order: sh.order ?? i + 1,
        })),
      });
    }
  }, [profileQuery.data, reset]);

  const toDecimal = (v, decimals = 2) => {
    const n = parseFloat(v);
    return isNaN(n) ? "" : n.toFixed(decimals);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        legal_form: values.legal_form,
        registration_number: values.registration_number,
        address: values.address,
        website: values.website,
        ceo_name: values.ceo_name,
        contact_person: values.contact_person,
        phone: values.phone,
        fax: values.fax,
        email: values.email,
        tax_number: values.tax_number,
        sales_tax_number: values.sales_tax_number,
        income_tax_id: values.income_tax_id,
        tax_office: values.tax_office,
        vat_registered: values.vat_registered,
        vat_rate: toDecimal(values.vat_rate) || "0.00",
        last_tax_filing: values.last_tax_filing || null,
        tax_status: values.tax_status,
        shareholders: values.shareholders.map((sh, i) => ({
          ...(sh._sid ? { id: sh._sid } : {}),
          name: sh.name,
          title: sh.title,
          ownership_percentage: toDecimal(sh.ownership_percentage) || "0.00",
          order: sh.order ?? i + 1,
        })),
      };
      await patchProfile.mutateAsync(payload);
      toast.success("Company profile updated successfully");
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
        typeof data === "string" ? data : "Failed to update company profile",
      );
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
          maxWidth: "780px",
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
              <Building2 size={18} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                Company Profile
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Review and update your company information for audit
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

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "2px solid var(--color-border)",
            padding: "0 1.5rem",
          }}
        >
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setProfileTab(tab.id)}
              style={{
                padding: "0.6rem 1rem",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderBottom:
                  profileTab === tab.id
                    ? "2px solid var(--color-primary-600)"
                    : "2px solid transparent",
                color:
                  profileTab === tab.id
                    ? "var(--color-primary-600)"
                    : "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: "0.8rem",
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

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
          }}
        >
          {profileQuery.isLoading && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "3rem",
              }}
            >
              <Spinner />
            </div>
          )}

          {profileQuery.isError && (
            <div
              style={{
                padding: "1rem",
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
              <span>Failed to load company profile. Please try again.</span>
            </div>
          )}

          {!profileQuery.isLoading && !profileQuery.isError && (
            <form id="company-profile-form" onSubmit={handleSubmit(onSubmit)}>
              {/* Overview Tab */}
              {profileTab === "overview" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  <div>
                    <h5
                      style={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <Briefcase size={14} /> Company Information
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Legal Form</label>
                        <input
                          {...register("legal_form", { required: true })}
                          style={inputStyle}
                          placeholder="e.g. Public Shareholding Company"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Registration Number</label>
                        <input
                          {...register("registration_number", {
                            required: true,
                          })}
                          style={inputStyle}
                          placeholder="e.g. JO-2019-28764"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Address</label>
                        <input
                          {...register("address", { required: true })}
                          style={inputStyle}
                          placeholder="Company address"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Website</label>
                        <input
                          {...register("website", { required: true })}
                          style={inputStyle}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5
                      style={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <Users size={14} /> Contact Details
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      <div>
                        <label style={labelStyle}>CEO Name</label>
                        <input
                          {...register("ceo_name", { required: true })}
                          style={inputStyle}
                          placeholder="CEO full name"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Contact Person</label>
                        <input
                          {...register("contact_person", { required: true })}
                          style={inputStyle}
                          placeholder="e.g. Ahmad Khatib (CFO)"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone</label>
                        <input
                          {...register("phone", { required: true })}
                          style={inputStyle}
                          placeholder="+962-..."
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Fax</label>
                        <input
                          {...register("fax", { required: true })}
                          style={inputStyle}
                          placeholder="+962-..."
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input
                          {...register("email", { required: true })}
                          type="email"
                          style={inputStyle}
                          placeholder="company@email.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Tab */}
              {profileTab === "tax" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  <div>
                    <h5
                      style={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        marginBottom: "1rem",
                        color: "var(--color-primary-600)",
                      }}
                    >
                      Tax Numbers
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Tax Number</label>
                        <input
                          {...register("tax_number", { required: true })}
                          style={inputStyle}
                          placeholder="TAX-XXX-XXXX"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Sales Tax Number</label>
                        <input
                          {...register("sales_tax_number", { required: true })}
                          style={inputStyle}
                          placeholder="ST-XXXXX-XXXX"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Income Tax ID</label>
                        <input
                          {...register("income_tax_id", { required: true })}
                          style={inputStyle}
                          placeholder="IT-XXXX-XXX"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Tax Office</label>
                        <input
                          {...register("tax_office", { required: true })}
                          style={inputStyle}
                          placeholder="Tax office name"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5
                      style={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        marginBottom: "1rem",
                        color: "var(--color-primary-600)",
                      }}
                    >
                      VAT & Status
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      <div>
                        <label style={labelStyle}>VAT Registered</label>
                        <Controller
                          control={control}
                          name="vat_registered"
                          render={({ field }) => (
                            <select
                              value={field.value ? "true" : "false"}
                              onChange={(e) =>
                                field.onChange(e.target.value === "true")
                              }
                              style={{ ...inputStyle, cursor: "pointer" }}
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          )}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>VAT Rate (%)</label>
                        <input
                          {...register("vat_rate", { required: true })}
                          type="number"
                          step="0.01"
                          style={inputStyle}
                          placeholder="e.g. 16.00"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Last Tax Filing</label>
                        <input
                          {...register("last_tax_filing", { required: true })}
                          type="date"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Tax Status</label>
                        <input
                          {...register("tax_status", { required: true })}
                          style={inputStyle}
                          placeholder="e.g. Compliant, Under Review"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shareholders Tab */}
              {profileTab === "shareholders" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h5
                      style={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <PieChart size={14} /> Ownership Structure
                    </h5>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() =>
                        append({
                          name: "",
                          title: "",
                          ownership_percentage: "",
                          order: fields.length + 1,
                        })
                      }
                    >
                      Add Shareholder
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "var(--color-text-muted)",
                        fontSize: "0.85rem",
                        border: "2px dashed var(--color-border)",
                        borderRadius: "10px",
                      }}
                    >
                      <PieChart
                        size={28}
                        style={{
                          marginBottom: "0.5rem",
                          opacity: 0.4,
                        }}
                      />
                      <p>No shareholders added yet.</p>
                      <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        Click &quot;Add Shareholder&quot; to begin.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          style={{
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-subtle)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: "var(--color-text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Shareholder #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeShareholder(index)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--color-error)",
                                padding: "0.25rem",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "0.75rem",
                            }}
                          >
                            <div>
                              <label style={labelStyle}>Name</label>
                              <input
                                {...register(`shareholders.${index}.name`, {
                                  required: true,
                                })}
                                style={inputStyle}
                                placeholder="Shareholder name"
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Title / Role</label>
                              <input
                                {...register(`shareholders.${index}.title`, {
                                  required: true,
                                })}
                                style={inputStyle}
                                placeholder="e.g. Chairman & CEO"
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Ownership (%)</label>
                              <input
                                {...register(
                                  `shareholders.${index}.ownership_percentage`,
                                  { required: true },
                                )}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                style={inputStyle}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Order</label>
                              <input
                                {...register(`shareholders.${index}.order`, {
                                  required: true,
                                  valueAsNumber: true,
                                })}
                                type="number"
                                min="1"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.65rem 1rem",
                        borderRadius: "8px",
                        background: ownershipValid
                          ? "var(--color-success-dim)"
                          : "var(--color-warning-dim)",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          color: ownershipValid
                            ? "var(--color-success)"
                            : "var(--color-warning)",
                          fontWeight: 600,
                        }}
                      >
                        {ownershipValid ? (
                          <CheckCircle size={15} />
                        ) : (
                          <AlertTriangle size={15} />
                        )}
                        {ownershipValid
                          ? "Ownership totals 100%"
                          : "Ownership percentages must total exactly 100%"}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: "monospace",
                          color: ownershipValid
                            ? "var(--color-success)"
                            : "var(--color-warning)",
                        }}
                      >
                        {ownershipTotal.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!profileQuery.isLoading && !profileQuery.isError && (
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
              type="submit"
              form="company-profile-form"
              icon={<Save size={16} />}
              disabled={
                !isDirty ||
                !isValid ||
                !ownershipValid ||
                isSubmitting ||
                patchProfile.isPending
              }
              isLoading={isSubmitting || patchProfile.isPending}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileModal;
