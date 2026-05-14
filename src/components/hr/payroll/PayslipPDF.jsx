import React, { useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useBasePath } from "@/hooks/useBasePath";
import Button from "@/components/Shared/Button";
import Card from "@/components/Shared/Card";
import Spinner from "@/core/Spinner";
import ResourceLoadError from "@/core/ResourceLoadError";
import useCustomQuery from "@/hooks/useQuery";
import { Printer, ArrowLeft } from "lucide-react";

const formatMoney = (value, currency = "USD") => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return `0.00 ${currency}`;
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const toTitleCase = (value) => {
  if (!value) return "—";
  const text = String(value).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const extractPeriods = (payload) => {
  if (Array.isArray(payload?.periods)) return payload.periods;
  if (Array.isArray(payload?.periods?.data)) return payload.periods.data;
  return [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatArabicDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const PayslipPDF = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = useBasePath();
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get("periodId");
  const lineId = searchParams.get("lineId");
  const printableRef = useRef(null);

  const payslipQuery = useCustomQuery(
    periodId && lineId
      ? `/api/hr/payroll/periods/${periodId}/lines/${lineId}/payslip/`
      : null,
    ["payroll-payslip-preview", periodId, lineId],
    { enabled: Boolean(periodId && lineId) },
  );

  const handlePrint = () => {
    window.print();
  };

  const payload = payslipQuery.data || {};
  const periods = extractPeriods(payload);
  const currentPeriod =
    periods.find((period) => period.id === periodId) || periods[0] || null;

  const isDetailedPayslip = Boolean(
    payload?.employee || payload?.totals || payload?.period,
  );
  const detailedPeriod = payload?.period || {};
  const detailedEmployee = payload?.employee || {};
  const detailedCompany = payload?.company || {};
  const earnings = Array.isArray(payload?.earnings) ? payload.earnings : [];
  const deductions = Array.isArray(payload?.deductions_items)
    ? payload.deductions_items
    : [];
  const totals = payload?.totals || {};

  const currency = detailedPeriod?.currency || currentPeriod?.currency || "USD";
  const netPay =
    totals?.net_pay ??
    currentPeriod?.total_net ??
    payload?.total_payroll_cost ??
    "0.00";
  const grossPay =
    totals?.gross_pay ??
    payload?.total_payroll_cost ??
    currentPeriod?.total_gross ??
    "0.00";
  const totalDeductions =
    totals?.total_deductions ?? currentPeriod?.total_deductions ?? "0.00";
  const adjustmentAmount = totals?.adjustment_amount ?? "0.00";
  const employeesPaid =
    payload?.active_employees_in_run ??
    payload?.active_empolyees_in_run ??
    currentPeriod?.employees_paid ??
    payload?.active_employees ??
    0;
  const payslipRef =
    payload?.payslip_number ||
    payload?.last_run_status?.journal_reference ||
    `PS-${lineId || id || "N/A"}`;
  const periodLabel =
    detailedPeriod?.name ||
    currentPeriod?.name ||
    payload?.last_run_status?.period_name ||
    "Payroll Period";
  const statusLabel =
    detailedPeriod?.status ||
    currentPeriod?.status ||
    payload?.last_run_status?.label ||
    "—";
  const periodStart = detailedPeriod?.start_date || currentPeriod?.period_start;
  const periodEnd = detailedPeriod?.end_date || currentPeriod?.period_end;
  const paymentDate =
    detailedPeriod?.payment_date ||
    payload?.next_pay_date ||
    currentPeriod?.pay_date;

  if (!periodId || !lineId) {
    return (
      <Card className="padding-lg">
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Missing required payroll context. Open payslip from a payroll period
          line.
        </p>
        <Button
          variant="outline"
          className="cursor-pointer"
          style={{ marginTop: "1rem" }}
          onClick={() => navigate(`${basePath}/hr/payroll`)}
        >
          Back to Payroll
        </Button>
      </Card>
    );
  }

  if (payslipQuery.isLoading) {
    return <Spinner />;
  }

  if (payslipQuery.isError) {
    return (
      <ResourceLoadError
        error={payslipQuery.error}
        title="Could not load payslip"
        onGoBack={() => navigate(`${basePath}/hr/payroll`)}
      />
    );
  }

  return (
    <div
      ref={printableRef}
      className="printable-area"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "white",
        padding: "40px",
      }}
    >
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2rem",
          borderBottom: "1px solid #eee",
          paddingBottom: "1rem",
        }}
      >
        <Button
          variant="ghost"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Button
            variant="primary"
            icon={<Printer size={18} />}
            onClick={handlePrint}
          >
            Print / Save as PDF
          </Button>
        </div>
      </div>
      <div
        className="print-content"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          flex: 1,
        }}
      >
        {/* Payslip Header */}
        <div
          className="print-section print-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--color-primary-700)",
                marginBottom: "0.5rem",
              }}
            >
              PAYSLIP
            </h1>
            <p style={{ color: "#666" }}>{payslipRef}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {detailedCompany?.name || "Antigravity Tech"}
            </h2>
            <p style={{ color: "#666" }}>
              {payload?.company_location || detailedCompany?.location || "—"}
            </p>
            <p style={{ color: "#666" }}>{toTitleCase(statusLabel)}</p>
          </div>
        </div>

        {/* Employee Info Box */}
        <div
          className="print-section print-info-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2.5rem",
            padding: "24px",
            background: "#f8fafc",
            borderRadius: "8px",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                color: "#64748b",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Employee Details
            </p>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.25rem",
              }}
            >
              {detailedEmployee?.name || `Employee #${id || "—"}`}
            </h3>
            <p style={{ color: "#475569" }}>
              Employee Name: {detailedEmployee?.name || "—"}
            </p>
            <p style={{ color: "#475569" }}>
              Department: {detailedEmployee?.department || "—"}
            </p>
            <p style={{ color: "#475569" }}>
              Position: {detailedEmployee?.position || "—"}
            </p>
            <p style={{ color: "#475569" }}>
              Account Number: {detailedEmployee?.account_number || "—"}
            </p>
            <p style={{ color: "#475569" }}>
              IBAN: {detailedEmployee?.iban || "—"}
            </p>
          </div>
          <div
            style={{
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                color: "#64748b",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Period Details
            </p>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.25rem",
              }}
            >
              {periodLabel}
            </h3>
            <p style={{ color: "#475569" }}>
              Period:{" "}
              <span dir="ltr" style={{ unicodeBidi: "plaintext" }}>
                {formatArabicDate(periodStart)} - {formatArabicDate(periodEnd)}
              </span>
            </p>
            <p style={{ color: "#475569" }}>
              Payment date:{" "}
              <span dir="ltr" style={{ unicodeBidi: "plaintext" }}>
                {formatArabicDate(paymentDate)}
              </span>
            </p>
            <p style={{ color: "#475569" }}>
              Company: {detailedCompany?.name || "Antigravity Tech"}
            </p>
            <p style={{ color: "#475569" }}>
              Tax ID: {detailedCompany?.tax_id || "—"}
            </p>
          </div>
        </div>

        {/* Calculations Table */}
        <div
          className="print-section print-calculations"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            marginBottom: "0.5rem",
          }}
        >
          {/* Earnings */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "170px",
            }}
          >
            <h4
              style={{
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "0.5rem",
                marginBottom: "1rem",
                fontWeight: 700,
              }}
            >
              EARNINGS
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.95rem",
              }}
            >
              {isDetailedPayslip && earnings.length > 0 ? (
                earnings.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>{item.label || "Earning"}</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatMoney(item.amount, currency)}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Total Payroll Cost</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatMoney(grossPay, currency)}
                  </span>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #eee",
                paddingTop: "0.75rem",
                marginTop: "0.95rem",
              }}
            >
              <span style={{ fontWeight: 700 }}>Total Earnings</span>
              <span style={{ fontWeight: 700 }}>
                {formatMoney(grossPay, currency)}
              </span>
            </div>
          </div>

          {/* Deductions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "170px",
            }}
          >
            <h4
              style={{
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "0.5rem",
                marginBottom: "1rem",
                fontWeight: 700,
              }}
            >
              DEDUCTIONS
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.95rem",
              }}
            >
              {isDetailedPayslip && deductions.length > 0 ? (
                deductions.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>{item.label || "Deduction"}</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--color-error-600)",
                      }}
                    >
                      -{formatMoney(item.amount, currency)}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Unspecified Deductions</span>
                  <span style={{ fontWeight: 600 }}>0.00 {currency}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Adjustment</span>
                <span style={{ fontWeight: 600 }}>
                  {formatMoney(adjustmentAmount, currency)}
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #eee",
                paddingTop: "0.75rem",
                marginTop: "auto",
              }}
            >
              <span style={{ fontWeight: 700 }}>Total Deductions</span>
              <span style={{ fontWeight: 700 }}>
                {formatMoney(totalDeductions, currency)}
              </span>
            </div>
          </div>
        </div>

        <div
          className="print-section print-totals-grid"
          style={{
            marginTop: "0.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                marginBottom: "0.2rem",
              }}
            >
              Gross Pay
            </div>
            <div style={{ fontWeight: 700 }}>
              {formatMoney(grossPay, currency)}
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                marginBottom: "0.2rem",
              }}
            >
              Total Deductions
            </div>
            <div style={{ fontWeight: 700 }}>
              {formatMoney(totalDeductions, currency)}
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                marginBottom: "0.2rem",
              }}
            >
              Adjustment Amount
            </div>
            <div style={{ fontWeight: 700 }}>
              {formatMoney(adjustmentAmount, currency)}
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                marginBottom: "0.2rem",
              }}
            >
              Net Pay
            </div>
            <div style={{ fontWeight: 700 }}>
              {formatMoney(netPay, currency)}
            </div>
          </div>
        </div>

        {/* Net Pay Summary */}
        <div
          className="print-section print-net-pay"
          style={{
            marginTop: "0.6rem",
            padding: "30px",
            background: "var(--color-primary-900)",
            color: "white",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                opacity: 0.8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Net Monthly Pay
            </p>
            <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Based on current payroll period summary
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800 }}>
              {formatMoney(netPay, currency)}
            </h2>
          </div>
        </div>
      </div>

      {/* Footer / Signature */}
      <div
        className="print-section print-signatures"
        style={{
          marginTop: "4rem",
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #eee",
          paddingTop: "2rem",
        }}
      >
        <div style={{ textAlign: "center", width: "200px" }}>
          <div
            style={{
              height: "50px",
              borderBottom: "1px solid #000",
              marginBottom: "0.5rem",
            }}
          ></div>
          <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            Employee Signature
          </p>
        </div>
        <div style={{ textAlign: "center", width: "200px" }}>
          <div
            style={{
              height: "50px",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="https://api.dicebear.com/7.x/initials/svg?seed=AT&backgroundColor=020617"
              alt="stamp"
              style={{ height: "50px", opacity: 0.2 }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            Authorized Stamp
          </p>
        </div>
      </div>
      {isDetailedPayslip && (
        <div
          className="print-extra-details"
          style={{
            marginTop: "1.25rem",
            color: "#64748b",
            fontSize: "0.85rem",
            lineHeight: 1.6,
          }}
        >
          <div>Bank: {detailedEmployee?.bank_name || "—"}</div>
          <div>Account: {detailedEmployee?.account_number || "—"}</div>
          <div>IBAN: {detailedEmployee?.iban || "—"}</div>
          <div>Company Tax ID: {detailedCompany?.tax_id || "—"}</div>
          <div>Active employees in run: {employeesPaid}</div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 7mm;
                    }
                    .no-print { display: none !important; }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    .printable-area,
                    .printable-area * {
                        visibility: visible !important;
                    }
                    .printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-sizing: border-box !important;
                        font-size: 13px !important;
                        line-height: 1.35 !important;
                        min-height: calc(297mm - 14mm) !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .print-content {
                        flex: 1 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: flex-start !important;
                        gap: 10px !important;
                    }
                    .printable-area,
                    .printable-area * {
                        color: #000 !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                    .printable-area [style*="background"] {
                        background: #fff !important;
                    }
                    .printable-area [style*="border"] {
                        border-color: #000 !important;
                    }
                    .print-header h1,
                    .print-header h2 {
                        color: #000 !important;
                    }
                    .print-net-pay {
                        border: 1px solid #000 !important;
                        border-radius: 0 !important;
                        padding: 14px 14px !important;
                        margin-top: 10px !important;
                    }
                    .print-signatures {
                        margin-top: auto !important;
                        padding-top: 8px !important;
                        border-top: 1px solid #000 !important;
                    }
                    .print-section {
                        margin-bottom: 12px !important;
                    }
                    .print-header {
                        margin-bottom: 20px !important;
                    }
                    .print-info-grid {
                        margin-bottom: 18px !important;
                        padding: 14px !important;
                    }
                    .print-calculations {
                        margin-bottom: 18px !important;
                    }
                    .print-totals-grid {
                        margin-bottom: 18px !important;
                    }
                    .print-net-pay {
                        margin-bottom: 24px !important;
                    }
                    .print-header h1 {
                        font-size: 34px !important;
                        margin-bottom: 4px !important;
                    }
                    .print-header h2 {
                        font-size: 28px !important;
                        margin: 0 !important;
                    }
                    .print-info-grid,
                    .print-calculations {
                        gap: 18px !important;
                    }
                    .print-info-grid p {
                        margin: 0 0 6px 0 !important;
                    }
                    .print-calculations > div {
                        min-height: 190px !important;
                    }
                    .print-totals-grid {
                        margin-top: 10px !important;
                        gap: 10px !important;
                    }
                    .print-totals-grid > div {
                        padding: 10px !important;
                    }
                    .print-net-pay h2 {
                        font-size: 42px !important;
                        margin: 0 !important;
                    }
                    .print-signatures img {
                        height: 44px !important;
                    }
                    .print-extra-details {
                        display: none !important;
                    }
                }
            `,
        }}
      />
    </div>
  );
};

export default PayslipPDF;
