import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useEmployeeCompanyName } from "@/hooks/useEmployeeCompanyName";

const PayslipPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["employee", "common"]);
  const companyName = useEmployeeCompanyName();
  const [payslip, setPayslip] = useState(null);

  useEffect(() => {
    setPayslip({
      id: id,
      month: "February 2026",
      period: "Feb 01, 2026 - Feb 28, 2026",
      employee: {
        name: "Sarah Connor",
        id: "EMP-2024-001",
        department: "Engineering",
        designation: "Senior Frontend Developer",
        joinDate: "Jan 15, 2024",
      },
      earnings: [
        { label: "Basic Salary", amount: 2500.0 },
        { label: "Housing Allowance", amount: 500.0 },
        { label: "Transport Allowance", amount: 200.0 },
        { label: "Performance Bonus", amount: 300.0 },
      ],
      deductions: [
        { label: "Income Tax", amount: 150.0 },
        { label: "Health Insurance", amount: 50.0 },
        { label: "Social Security", amount: 50.0 },
      ],
      netPay: 3250.0,
      paymentMethod: "Bank Transfer",
      bankDetails: "Chase Bank **** 1234",
    });
  }, [id]);

  if (!payslip) return <div>{t("employee:payslipPreview.loading")}</div>;

  const totalEarnings = payslip.earnings.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const totalDeductions = payslip.deductions.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Button
          variant="ghost"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate("/employee/payslips")}
        >
          {t("employee:payslipPreview.back")}
        </Button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {t("employee:payslipPreview.title", { month: payslip.month })}
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {t("employee:payslipPreview.reference", { id })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="outline" icon={<Printer size={18} />}>
            {t("employee:payslipPreview.print")}
          </Button>
          <Button icon={<Download size={18} />}>
            {t("employee:payslipPreview.downloadPdf")}
          </Button>
        </div>
      </div>

      <Card
        className="padding-xl"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "2px solid var(--color-slate-100)",
            paddingBottom: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--color-primary-600)",
                marginBottom: "0.5rem",
              }}
            >
              {companyName}
            </div>
            <div
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.875rem",
              }}
            >
              {t("employee:payslipPreview.companyAddress")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "0.25rem",
              }}
            >
              {t("employee:payslipPreview.payslip")}
            </div>
            <div style={{ color: "var(--color-text-secondary)" }}>
              {payslip.period}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              {t("employee:payslipPreview.details")}
            </h4>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.1rem",
                marginBottom: "0.25rem",
              }}
            >
              {payslip.employee.name}
            </div>
            <div
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              {payslip.employee.designation}
            </div>
            <div
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              ID: {payslip.employee.id}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h4
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              {t("employee:payslipPreview.bankDetails")}
            </h4>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: "0.25rem",
              }}
            >
              {payslip.paymentMethod}
            </div>
            <div
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              {payslip.bankDetails}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginBottom: "2rem",
          }}
        >
          <div style={{ borderRight: "1px solid var(--color-border)" }}>
            <div
              style={{
                background: "var(--color-bg-table-header)",
                padding: "0.75rem 1rem",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderBottom: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("employee:payslipPreview.earnings")}
            </div>
            <div style={{ padding: "1rem" }}>
              {payslip.earnings.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={{ color: "var(--color-text-main)" }}>
                    {item.label}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    ${item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "0.75rem",
                  marginTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                }}
              >
                <span>{t("employee:payslipPreview.totalEarnings")}</span>
                <span>${totalEarnings.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                background: "var(--color-bg-table-header)",
                padding: "0.75rem 1rem",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderBottom: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("employee:payslipPreview.deductions")}
            </div>
            <div style={{ padding: "1rem" }}>
              {payslip.deductions.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={{ color: "var(--color-text-main)" }}>
                    {item.label}
                  </span>
                  <span
                    style={{ fontWeight: 500, color: "var(--color-error)" }}
                  >
                    -${item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "0.75rem",
                  marginTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                }}
              >
                <span>{t("employee:payslipPreview.totalDeductions")}</span>
                <span style={{ color: "var(--color-error)" }}>
                  -${totalDeductions.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background:
              "color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))",
            border:
              "1px solid color-mix(in srgb, var(--color-primary-500) 35%, var(--color-border))",
            padding: "1.5rem",
            borderRadius: "var(--radius-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--color-primary-500)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {t("employee:payslipPreview.netPay")}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("employee:payslipPreview.netPayDescription")}
            </div>
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-text-main)",
            }}
          >
            ${payslip.netPay.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
          }}
        >
          {t("employee:payslipPreview.footer")}
        </div>
      </Card>
    </div>
  );
};

export default PayslipPreview;
