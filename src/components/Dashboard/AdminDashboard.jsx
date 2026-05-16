import React, { useState, useMemo, useCallback, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  Wallet,
  FileText,
  UserCheck,
  Truck,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Card from "@/components/Shared/Card";
import Spinner from "@/core/Spinner";
import useCustomQuery from "@/hooks/useQuery";
import styles from "./AdminDashboard.module.css";

const formatChartMonthLabel = (year, month, locale) => {
  const dt = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(dt);
};
const formatChartWeekLabel = (dateKey, locale) => {
  const dt = new Date(dateKey);
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(dt);
};

const aggregateData = (data, mode, locale) => {
  if (mode === "daily")
    return data.map((d) => ({ label: d.date.slice(5), ...d }));
  const groups = {};
  data.forEach((d) => {
    const dt = new Date(d.date);
    let key;
    if (mode === "weekly") {
      const weekStart = new Date(dt);
      weekStart.setDate(dt.getDate() - dt.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else if (mode === "monthly") {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = `${dt.getFullYear()}`;
    }
    if (!groups[key]) groups[key] = { revenue: 0, expenses: 0 };
    groups[key].revenue += d.revenue;
    groups[key].expenses += d.expenses;
  });
  return Object.entries(groups).map(([key, val]) => {
    let label = key;
    if (mode === "monthly") {
      const [y, m] = key.split("-");
      label = formatChartMonthLabel(y, m, locale);
    } else if (mode === "weekly") {
      label = formatChartWeekLabel(key, locale);
    }
    return { label, revenue: val.revenue, expenses: val.expenses };
  });
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];
const DEFAULT_DEPARTMENT_COLOR = "#6b7280";
const DEPARTMENT_COLORS = {
  finance: "#10b981",
  hr: "#3b82f6",
  inventory: "#f59e0b",
  sales: "#8b5cf6",
};

const formatNumber = (value, locale) =>
  Number(value ?? 0).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
const formatCurrency = (value, currency, locale) => {
  const numericValue = Number(value ?? 0);
  if (!currency) return formatNumber(numericValue, locale);
  return `${formatNumber(numericValue, locale)} ${currency}`;
};

const formatCompactCurrency = (value, currency, locale) => {
  const numericValue = Number(value ?? 0);
  const compact =
    numericValue >= 1000
      ? formatNumber(numericValue / 1000, locale) + "k"
      : formatNumber(numericValue, locale);
  if (!currency) return compact;
  return `${compact} ${currency}`;
};
const isPositiveTrend = (trend) => {
  if (!trend || typeof trend !== "string") return undefined;
  if (trend.includes("+")) return true;
  if (trend.includes("-")) return false;
  return undefined;
};

const normalizeLabelKey = (value = "") =>
  String(value).trim().toLowerCase().replace(/\s+/g, " ");

const THIS_MONTH_TREND_PATTERN = /^this\s+month\s+([\d.,]+)\s*([+-])?\s*$/i;

const DEPARTMENT_LABEL_KEYS = {
  finance: "dashboard:admin.deptFinance",
  accounting: "dashboard:admin.deptFinance",
  "finance & accounting": "dashboard:admin.financeAndAccounting",
  "finance and accounting": "dashboard:admin.financeAndAccounting",
  hr: "dashboard:admin.deptHumanResources",
  "human resources": "dashboard:admin.deptHumanResources",
  inventory: "dashboard:admin.deptInventory",
  "inventory & warehouse": "dashboard:admin.inventoryAndWarehouse",
  sales: "dashboard:admin.deptSales",
  "sales & crm": "dashboard:admin.salesAndCrm",
  general: "dashboard:admin.deptGeneral",
};

const translateDashboardTrend = (t, trend) => {
  if (!trend || typeof trend !== "string") return trend;
  const trimmed = trend.trim();
  const monthMatch = trimmed.match(THIS_MONTH_TREND_PATTERN);
  if (monthMatch) {
    const [, count, sign] = monthMatch;
    if (sign === "+") return t("dashboard:admin.trendThisMonthUp", { count });
    if (sign === "-") return t("dashboard:admin.trendThisMonthDown", { count });
    return t("dashboard:admin.trendThisMonth", { count });
  }
  return trimmed;
};

const translateDepartmentLabel = (t, label) => {
  const key = DEPARTMENT_LABEL_KEYS[normalizeLabelKey(label)];
  return key ? t(key) : label || t("dashboard:admin.general");
};

const ACTIVITY_COLOR_ALIASES = {
  finance: "finance",
  accounting: "finance",
  "finance & accounting": "finance",
  "finance and accounting": "finance",
  hr: "hr",
  "human resources": "hr",
  inventory: "inventory",
  "inventory & warehouse": "inventory",
  sales: "sales",
  "sales & crm": "sales",
};

const resolveActivityColor = (label = "") => {
  const normalized = normalizeLabelKey(label);
  const deptKey =
    ACTIVITY_COLOR_ALIASES[normalized] ||
    ACTIVITY_COLOR_ALIASES[normalized.split(" ")[0]];
  return DEPARTMENT_COLORS[deptKey] || DEFAULT_DEPARTMENT_COLOR;
};

const useElementWidth = () => {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(0);

  const elementRef = useCallback((el) => {
    setNode(el);
  }, []);

  useLayoutEffect(() => {
    if (!node) return undefined;

    const updateWidth = () => {
      setWidth(node.getBoundingClientRect().width || 0);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, [node]);

  return { elementRef, width };
};

// ── Main Component ─────────────────────────────────────

const AdminDashboard = () => {
  const { t, i18n } = useTranslation(["dashboard", "common"]);
  const navigate = useNavigate();
  const [chartFilter, setChartFilter] = useState("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data, isLoading, isError } = useCustomQuery(
    "/api/shared/dashboard/main/",
    ["shared-dashboard-main"],
  );
  const { elementRef: revenueChartRef, width: revenueChartWidth } =
    useElementWidth();
  const { elementRef: expenseChartRef, width: expenseChartWidth } =
    useElementWidth();
  const dashboardCurrency =
    data?.revenue_vs_expenses?.currency || data?.total_revenue?.currency;
  const locale = i18n.language;

  const revenueSeriesData = useMemo(() => {
    const series = data?.revenue_vs_expenses?.series || [];
    return series.map((item) => ({
      date: item?.period_start || item?.period,
      revenue: Number(item?.revenue ?? 0),
      expenses: Number(item?.expenses ?? 0),
    }));
  }, [data?.revenue_vs_expenses?.series]);

  const chartData = useMemo(() => {
    let filtered = revenueSeriesData;
    if (dateFrom) filtered = filtered.filter((d) => d.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((d) => d.date <= dateTo);
    // If date range is short (≤14 days), show daily; otherwise use selected mode
    const effectiveMode =
      dateFrom && dateTo
        ? (new Date(dateTo) - new Date(dateFrom)) / 86400000 <= 14
          ? "daily"
          : chartFilter
        : chartFilter;
    return aggregateData(filtered, effectiveMode, i18n.language);
  }, [chartFilter, dateFrom, dateTo, revenueSeriesData, i18n.language]);

  const expenseBreakdown = useMemo(() => {
    const segments = data?.expense_breakdown?.segments || [];
    return segments.map((segment) => ({
      name: segment?.label || t('dashboard:admin.unknown'),
      value: Number(segment?.value ?? 0),
    }));
  }, [data?.expense_breakdown?.segments, t]);

  const recentActivity = useMemo(() => {
    const items = data?.recent_activity?.items || [];
    return items.map((item, index) => ({
      id: `${item?.message || "activity"}-${index}`,
      text: item?.message || "-",
      dept: translateDepartmentLabel(t, item?.label),
      time: item?.age_label || "",
      color: resolveActivityColor(item?.label),
    }));
  }, [data?.recent_activity?.items, t]);

  const dateInputStyle = {
    padding: "0.35rem 0.5rem",
    borderRadius: "0.4rem",
    border: "1px solid var(--color-border)",
    fontSize: "0.75rem",
    color: "var(--color-text-main)",
    background: "var(--color-bg-surface)",
    outline: "none",
    cursor: "pointer",
  };

  const chartTooltipStyle = {
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-md)",
    background: "var(--color-bg-card)",
    color: "var(--color-text-main)",
  };

  if (isLoading) {
    return (
      <div
        style={{ minHeight: "320px", display: "grid", placeItems: "center" }}
      >
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="padding-lg">
        <p style={{ color: "var(--color-error)" }}>
          {t('dashboard:admin.loadFailed')}
        </p>
      </Card>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--color-text-main)",
          }}
        >
          {t('dashboard:admin.title')}
        </h1>
        <p
          style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}
        >
          {t('dashboard:admin.subtitle')}
        </p>
      </div>

      {/* ── Top KPI Row ── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label={t('dashboard:admin.totalRevenue')}
          value={formatCurrency(
            data?.total_revenue?.value,
            data?.total_revenue?.currency,
            locale,
          )}
          change={translateDashboardTrend(t, data?.total_revenue?.trend)}
          up={isPositiveTrend(data?.total_revenue?.trend)}
          icon={<DollarSign size={20} />}
          accent="#10b981"
        />
        <KpiCard
          label={t('dashboard:admin.employees')}
          value={formatNumber(data?.employees?.value, locale)}
          change={translateDashboardTrend(t, data?.employees?.trend)}
          up={isPositiveTrend(data?.employees?.trend)}
          icon={<Users size={20} />}
          accent="#3b82f6"
        />
        <KpiCard
          label={t('dashboard:admin.inventoryItems')}
          value={formatNumber(data?.inventory_items?.value, locale)}
          change={
            typeof data?.inventory_items?.low_stock === "number"
              ? t('dashboard:admin.lowStock', { count: data.inventory_items.low_stock })
              : undefined
          }
          icon={<Package size={20} />}
          accent="#f59e0b"
        />
        <KpiCard
          label={t('dashboard:admin.openOrders')}
          value={formatNumber(data?.open_orders?.value, locale)}
          change={translateDashboardTrend(t, data?.open_orders?.trend)}
          up={isPositiveTrend(data?.open_orders?.trend)}
          icon={<ShoppingCart size={20} />}
          accent="#8b5cf6"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className={styles.chartsGrid}>
        {/* Revenue Trend */}
        <Card
          className={`padding-lg ${styles.fullWidthGridItem}`}
          style={{ minWidth: 0 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text-main)",
              }}
            >
              {t('dashboard:admin.revenueVsExpenses')}
            </h3>
            <div
              style={{
                display: "flex",
                gap: "0.25rem",
                background:
                  "color-mix(in srgb, var(--color-text-main) 8%, var(--color-bg-card))",
                borderRadius: "0.5rem",
                padding: "3px",
              }}
            >
              {["weekly", "monthly", "yearly"].map((f) => (
                <button
                  key={f}
                  onClick={() => setChartFilter(f)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "0.4rem",
                    border: "none",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background:
                      chartFilter === f
                        ? "var(--color-bg-surface)"
                        : "transparent",
                    color:
                      chartFilter === f
                        ? "var(--color-text-main)"
                        : "var(--color-text-muted)",
                    boxShadow:
                      chartFilter === f ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    borderWidth: chartFilter === f ? "1px" : 0,
                    borderStyle: "solid",
                    borderColor:
                      chartFilter === f ? "var(--color-border)" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  {f === "weekly"
                    ? t('dashboard:admin.weekly')
                    : f === "monthly"
                      ? t('dashboard:admin.monthly')
                      : t('dashboard:admin.yearly')}
                </button>
              ))}
            </div>
          </div>
          {/* Date Range Filter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                fontWeight: 500,
              }}
            >
              {t('dashboard:admin.from')}
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={dateInputStyle}
            />
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                fontWeight: 500,
              }}
            >
              {t('dashboard:admin.to')}
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={dateInputStyle}
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "0.4rem",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "var(--color-bg-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                {t('common:actions.clear')}
              </button>
            )}
          </div>
          <div
            ref={revenueChartRef}
            style={{
              width: "100%",
              minWidth: 0,
              height: "250px",
              minHeight: 250,
            }}
          >
            {revenueChartWidth > 0 && (
              <AreaChart
                width={revenueChartWidth}
                height={250}
                data={chartData}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  tickFormatter={(v) =>
                    formatCompactCurrency(v, dashboardCurrency)
                  }
                />
                <RechartsTooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: "var(--color-text-main)" }}
                  formatter={(value, name) => [
                    formatCurrency(value, dashboardCurrency, locale),
                    name,
                  ]}
                />
                <Legend iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name={t("dashboard:admin.revenue")}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={t("dashboard:admin.expenses")}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#expGrad)"
                />
              </AreaChart>
            )}
          </div>
        </Card>

        {/* Expense Breakdown */}
        {/* <Card className="padding-lg" style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>{data?.expense_breakdown?.title || 'Expense Breakdown'}</h3>
                    <div ref={expenseChartRef} style={{ width: '100%', minWidth: 0, height: '250px', minHeight: 250 }}>
                        {expenseChartWidth > 0 && (
                            <PieChart width={expenseChartWidth} height={250}>
                                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {expenseBreakdown.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Legend iconType="circle" />
                                <RechartsTooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--color-text-main)' }} />
                            </PieChart>
                        )}
                    </div>
                </Card> */}
      </div>

      {/* ── Department Panels ── */}
      <div className={styles.deptGrid}>
        {/* Finance & Accounting */}
        <DeptCard
          title={t('dashboard:admin.financeAndAccounting')}
          accent="#10b981"
          icon={<Wallet size={20} />}
          onClick={() => navigate("/admin/accounting")}
          stats={[
            {
              label: t('dashboard:admin.cashBalance'),
              value: formatCurrency(
                data?.finance_and_accounting?.cash_balance,
                data?.finance_and_accounting?.cash_balance_currency ||
                  data?.finance_and_accounting?.currency,
                locale,
              ),
            },
            {
              label: t('dashboard:admin.receivables'),
              value: formatCurrency(
                data?.finance_and_accounting?.receivables,
                data?.finance_and_accounting?.receivables_currency ||
                  data?.finance_and_accounting?.currency,
                locale,
              ),
            },
            {
              label: t('dashboard:admin.payables'),
              value: formatCurrency(
                data?.finance_and_accounting?.payables,
                data?.finance_and_accounting?.payables_currency ||
                  data?.finance_and_accounting?.currency,
                locale,
              ),
            },
            {
              label: t('dashboard:admin.netProfit'),
              value: formatCurrency(
                data?.finance_and_accounting?.net_profit,
                data?.finance_and_accounting?.net_profit_currency ||
                  data?.finance_and_accounting?.currency,
                locale,
              ),
              trend: translateDashboardTrend(
                t,
                data?.finance_and_accounting?.net_profit_trend,
              ),
              up: isPositiveTrend(
                data?.finance_and_accounting?.net_profit_trend,
              ),
            },
          ]}
        />

        {/* Human Resources */}
        <DeptCard
          title={t('dashboard:admin.humanResources')}
          accent="#3b82f6"
          icon={<UserCheck size={20} />}
          onClick={() => navigate("/admin/hr")}
          stats={[
            {
              label: t('dashboard:admin.totalEmployees'),
              value: formatNumber(data?.human_resources?.total_employees, locale),
            },
            {
              label: t('dashboard:admin.onLeaveToday'),
              value: formatNumber(data?.human_resources?.on_leave_today, locale),
            },
            {
              label: t('dashboard:admin.openPositions'),
              value: formatNumber(data?.human_resources?.open_positions, locale),
            },
            {
              label: t('dashboard:admin.payrollMonthly'),
              value: formatCurrency(
                data?.human_resources?.payroll_monthly,
                data?.human_resources?.payroll_monthly_currency,
                locale,
              ),
            },
          ]}
        />

        {/* Inventory & Warehouse */}
        <DeptCard
          title={t('dashboard:admin.inventoryAndWarehouse')}
          accent="#f59e0b"
          icon={<Package size={20} />}
          onClick={() => navigate("/admin/inventory")}
          stats={[
            {
              label: t('dashboard:admin.totalItems'),
              value: formatNumber(data?.inventory_and_warehouse?.total_items, locale),
            },
            {
              label: t('dashboard:admin.stockValue'),
              value: formatCurrency(
                data?.inventory_and_warehouse?.stock_value,
                data?.inventory_and_warehouse?.stock_value_currency,
                locale,
              ),
            },
            {
              label: t('dashboard:admin.lowStockItems'),
              value: formatNumber(
                data?.inventory_and_warehouse?.low_stock_items,
                locale,
              ),
              color: "#ef4444",
            },
            {
              label: t('dashboard:admin.pendingPOs'),
              value: formatNumber(
                data?.inventory_and_warehouse?.pending_purchase_orders,
                locale,
              ),
            },
          ]}
        />

        {/* Sales & CRM */}
        <DeptCard
          title={t('dashboard:admin.salesAndCrm')}
          accent="#8b5cf6"
          icon={<ShoppingCart size={20} />}
          onClick={() => navigate("/admin/sales")}
          stats={[
            {
              label: t('dashboard:admin.activeOrders'),
              value: formatNumber(data?.sales_and_crm?.active_orders, locale),
            },
            {
              label: t('dashboard:admin.monthlySales'),
              value: formatCurrency(
                data?.sales_and_crm?.monthly_sales,
                data?.sales_and_crm?.monthly_sales_currency ||
                  data?.sales_and_crm?.currency,
                locale,
              ),
              trend: translateDashboardTrend(
                t,
                data?.sales_and_crm?.monthly_sales_trend,
              ),
              up: isPositiveTrend(data?.sales_and_crm?.monthly_sales_trend),
            },
            {
              label: t('dashboard:admin.customers'),
              value: formatNumber(data?.sales_and_crm?.customers, locale),
            },
            {
              label: t('dashboard:admin.avgOrderValue'),
              value: formatCurrency(
                data?.sales_and_crm?.avg_order_value,
                data?.sales_and_crm?.avg_order_value_currency ||
                  data?.sales_and_crm?.currency,
                locale,
              ),
            },
          ]}
        />
      </div>

      {/* ── Recent Activity ── */}
      <Card className="padding-lg">
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          {t('dashboard:admin.recentActivity')}
        </h3>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentActivity.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: "1rem 0",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
              }}
            >
              {t("dashboard:admin.noRecentActivity")}
            </p>
          ) : (
          recentActivity.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 0",
                borderBottom: "1px solid var(--color-border)",
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
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.9rem" }}>{item.text}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: item.color,
                    background: `${item.color}15`,
                    padding: "2px 8px",
                    borderRadius: "1rem",
                  }}
                >
                  {item.dept}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {item.time}
                </span>
              </div>
            </div>
          ))
          )}
        </div>
      </Card>
    </div>
  );
};

// ── Sub-Components ─────────────────────────────────────

const KpiCard = ({ label, value, change, up, icon, accent }) => (
  <Card
    className="padding-md hoverable"
    style={{ borderLeft: `4px solid ${accent}` }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-secondary)",
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.25rem" }}
        >
          {value}
        </h3>
      </div>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: `${accent}15`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
    </div>
    {change && (
      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.8rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {up !== undefined && (
          <span
            style={{
              color: up ? "#10b981" : "#ef4444",
              display: "flex",
              alignItems: "center",
            }}
          >
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </span>
        )}
        <span style={{ color: "var(--color-text-muted)" }}>{change}</span>
      </div>
    )}
  </Card>
);

const DeptCard = ({ title, accent, icon, stats, onClick }) => (
  <Card
    className="padding-lg hoverable"
    style={{ cursor: "pointer", borderTop: `3px solid ${accent}` }}
    onClick={onClick}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: `${accent}15`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{title}</h3>
      </div>
      <ChevronRight size={18} color="var(--color-text-muted)" />
    </div>
    <div className={styles.deptStatsGrid}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: "0.5rem 0" }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              marginBottom: "2px",
            }}
          >
            {s.label}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: s.color || "var(--color-text-main)",
              }}
            >
              {s.value}
            </span>
            {s.trend && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: s.up ? "#10b981" : "#ef4444",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {s.up ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}{" "}
                {s.trend}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export default AdminDashboard;
