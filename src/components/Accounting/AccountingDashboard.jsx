import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useBasePath } from "@/hooks/useBasePath";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Spinner from "@/core/Spinner";
import useCustomQuery from "@/hooks/useQuery";
import {
  FileText,
  List,
  Plus,
  Landmark,
  Monitor,
  Percent,
  Users,
  ArrowUpRight,
  ArrowUpLeft,
  DollarSign,
  ShoppingCart,
  Package,
  Target,
  CheckCircle,
  Upload,
  Shield,
  ArrowLeft,
  ArrowRight,
  Hammer,
  Map,
  Box,
  Building2,
  Banknote,
  X,
  Wallet,
} from "lucide-react";

const normalizeRecentTransactionsResponse = (response, recentTransactionsTitle) => ({
  title: response?.title || recentTransactionsTitle,
  items: Array.isArray(response?.items) ? response.items : [],
});

const getTransactionIcon = (iconName) => {
  const normalizedIcon = String(iconName || "").toLowerCase();
  const icons = {
    bank: <Banknote size={18} />,
    building: <Building2 size={18} />,
    cart: <ShoppingCart size={18} />,
    cube: <Box size={18} />,
    hammer: <Hammer size={18} />,
    map: <Map size={18} />,
  };

  return icons[normalizedIcon] || <DollarSign size={18} />;
};

const getTransactionColors = (transaction) => {
  const amount = Number(transaction?.amount ?? 0);
  const icon = String(transaction?.icon || "").toLowerCase();

  if (amount > 0) {
    return {
      amountColor: "var(--color-success)",
      bg: "var(--color-success-dim)",
      iconColor: "var(--color-success)",
    };
  }

  if (amount < 0) {
    return {
      amountColor: "var(--color-error)",
      bg: "var(--color-error-dim)",
      iconColor: "var(--color-error)",
    };
  }

  if (icon === "bank") {
    return {
      amountColor: "var(--color-text-main)",
      bg: "var(--color-warning-dim)",
      iconColor: "var(--color-warning)",
    };
  }

  if (transaction?.kind === "fixed_asset") {
    return {
      amountColor: "var(--color-text-main)",
      bg: "color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))",
      iconColor: "var(--color-primary-500)",
    };
  }

  return {
    amountColor: "var(--color-text-main)",
    bg: "color-mix(in srgb, var(--color-text-main) 12%, var(--color-bg-card))",
    iconColor: "var(--color-text-secondary)",
  };
};

const formatTransactionAmount = (amount, currency, locale) => {
  const numericAmount = Number(amount ?? 0);
  const absoluteAmount = Math.abs(numericAmount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = numericAmount > 0 ? "+" : numericAmount < 0 ? "-" : "";
  const currencySuffix = currency ? ` ${currency}` : "";

  return `${sign}${absoluteAmount}${currencySuffix}`;
};

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const translateShortDateLabel = (value, locale) => {
  const match = String(value || "").trim().match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
  if (!match) return value;

  const monthIndex = MONTH_INDEX[match[1].toLowerCase()];
  if (monthIndex === undefined) return value;

  const date = new Date(2026, monthIndex, Number(match[2]));
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
  }).format(date);
};

const translateRecentTransactionWhen = (whenPart, t, locale) => {
  const trimmed = String(whenPart || "").trim();
  if (!trimmed) return trimmed;

  const todayMatch = trimmed.match(/^today,\s*(.+)$/i);
  if (todayMatch) {
    return t("dashboard.recentTransactionItems.timeToday", {
      time: todayMatch[1].trim(),
    });
  }

  const yesterdayMatch = trimmed.match(/^yesterday,\s*(.+)$/i);
  if (yesterdayMatch) {
    return t("dashboard.recentTransactionItems.timeYesterday", {
      time: yesterdayMatch[1].trim(),
    });
  }

  const datedMatch = trimmed.match(/^([A-Za-z]{3}\s+\d{1,2}),\s*(.+)$/i);
  if (datedMatch) {
    return t("dashboard.recentTransactionItems.timeOnDate", {
      date: translateShortDateLabel(datedMatch[1], locale),
      time: datedMatch[2].trim(),
    });
  }

  return trimmed;
};

const translateRecentTransaction = (transaction, t, locale) => {
  const title = String(transaction?.title || "").trim();
  const subtitle = String(transaction?.subtitle || "").trim();
  const kind = String(transaction?.kind || "").toLowerCase();
  const statusCode = String(
    transaction?.status_code || transaction?.status || "",
  )
    .trim()
    .toLowerCase();

  let translatedTitle = title;
  let translatedSubtitle = subtitle;

  const newAssetMatch = title.match(/^new asset:\s*(.+)$/i);
  if (newAssetMatch) {
    translatedTitle = t("dashboard.recentTransactionItems.newAsset", {
      name: newAssetMatch[1].trim(),
    });
  }

  const goodsIssueMatch = title.match(/^goods issue\s*-\s*(.+)$/i);
  if (goodsIssueMatch) {
    translatedTitle = t("dashboard.recentTransactionItems.goodsIssue", {
      reference: goodsIssueMatch[1].trim(),
    });
  }

  const fixedAssetSubtitleMatch = subtitle.match(
    /^fixed assets\s*-\s*(.+?)\s*-\s*(.+)$/i,
  );
  if (fixedAssetSubtitleMatch) {
    translatedSubtitle = t("dashboard.recentTransactionItems.fixedAssetsSubtitle", {
      name: fixedAssetSubtitleMatch[1].trim(),
      when: translateRecentTransactionWhen(
        fixedAssetSubtitleMatch[2],
        t,
        locale,
      ),
    });
  }

  const vendorSubtitleMatch = subtitle.match(
    /^vendor:\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+)$/i,
  );
  if (vendorSubtitleMatch) {
    translatedSubtitle = t("dashboard.recentTransactionItems.vendorSubtitle", {
      vendor: vendorSubtitleMatch[1].trim(),
      detail: vendorSubtitleMatch[2].trim(),
      when: translateRecentTransactionWhen(vendorSubtitleMatch[3], t, locale),
    });
  }

  if (kind === "journal_entry" && translatedSubtitle === subtitle) {
    const journalSubtitleMatch = subtitle.match(/^(.+?)\s*-\s*(.+)$/i);
    if (journalSubtitleMatch) {
      translatedSubtitle = t("dashboard.recentTransactionItems.journalSubtitle", {
        account: journalSubtitleMatch[1].trim(),
        when: translateRecentTransactionWhen(journalSubtitleMatch[2], t, locale),
      });
    }
  }

  const statusKey = statusCode ? `common:status.${statusCode}` : "";
  const translatedStatus =
    statusKey && t(statusKey, { defaultValue: "" })
      ? t(statusKey)
      : transaction?.status || t("common:status.posted");

  return {
    ...transaction,
    title: translatedTitle,
    subtitle: translatedSubtitle,
    status: translatedStatus,
  };
};

const AccountingDashboard = () => {
  const { t, i18n } = useTranslation(['accounting', 'common']);
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ViewAllIcon = isRtl ? ArrowUpLeft : ArrowUpRight;
  const navigate = useNavigate();
  const basePath = useBasePath();
  const [isRecentTransactionsOpen, setIsRecentTransactionsOpen] =
    useState(false);
  const recentTransactionsQuery = useCustomQuery(
    "/api/shared/dashboard/recent-transactions/",
    ["shared-dashboard-recent-transactions"],
    { select: (response) => normalizeRecentTransactionsResponse(response, t('dashboard.recentTransactions')) },
  );

  const recentTransactionsTitle = t("dashboard.recentTransactions");
  const recentTransactions = recentTransactionsQuery.data?.items ?? [];
  const translatedTransactions = useMemo(
    () =>
      recentTransactions.map((transaction) =>
        translateRecentTransaction(transaction, t, i18n.language),
      ),
    [recentTransactions, t, i18n.language],
  );
  const previewTransactions = translatedTransactions.slice(0, 4);

  useEffect(() => {
    if (!isRecentTransactionsOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isRecentTransactionsOpen]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
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
          }}
        >
          <Button
            variant="ghost"
            icon={<BackIcon size={18} />}
            onClick={() => navigate(`${basePath}/dashboard`)}
            className="cursor-pointer shrink-0"
            aria-label={t("common:actions.back")}
          />
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--color-text-main)",
              }}
            >
              {t('dashboard.title')}
            </h1>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {t('dashboard.subtitle')}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }} className="shrink-0">
          <Button
            icon={<Plus size={18} />}
            onClick={() => navigate("journal/new")}
            className="cursor-pointer"
          >
            {t('dashboard.newJournalEntry')}
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("coa")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <List size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.chartOfAccounts.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.chartOfAccounts.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("gl")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <FileText size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.generalLedger.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.generalLedger.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("journal")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <FileText size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.journalEntries.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.journalEntries.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("invoices")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <FileText size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.salesInvoices.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.salesInvoices.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("products-services")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <Package size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.productsServices.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.productsServices.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("customers")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <Users size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.customers.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.customers.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("bank")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <Landmark size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.bankCash.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.bankCash.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("assets")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <Monitor size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.fixedAssets.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.fixedAssets.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("trial-balance")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <Percent size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.trialBalance.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.trialBalance.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("accountant-payments")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <Wallet size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.accountantPayment.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.accountantPayment.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate(`${basePath}/reports`)}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <FileText size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.reportsCenter.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.reportsCenter.description')}
          </p>
        </Card>
        <Card
          className="padding-md hoverable"
          style={{
            width: "240px",
            cursor: "pointer",
            border:
              "1px solid color-mix(in srgb, var(--color-primary-600) 40%, var(--color-border))",
            background:
              "color-mix(in srgb, var(--color-primary-600) 18%, var(--color-bg-card))",
          }}
          onClick={() => navigate("vendor-payments")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <CheckCircle size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.vendorPayments.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.vendorPayments.description')}
          </p>
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "0.7rem",
              background: "var(--color-primary-600)",
              color: "white",
              padding: "2px 8px",
              borderRadius: "10px",
              display: "inline-block",
            }}
          >
            {t('dashboard.approvalsNeeded')}
          </div>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{ width: "240px", cursor: "pointer" }}
          onClick={() => navigate("bank-import")}
        >
          <div
            style={{ marginBottom: "1rem", color: "var(--color-primary-600)" }}
          >
            <Upload size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.bankImport.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.bankImport.description')}
          </p>
        </Card>

        <Card
          className="padding-md hoverable"
          style={{
            width: "240px",
            cursor: "pointer",
            border:
              "1px solid color-mix(in srgb, var(--color-secondary-600) 40%, var(--color-border))",
            background:
              "color-mix(in srgb, var(--color-secondary-600) 18%, var(--color-bg-card))",
          }}
          onClick={() => navigate("audit")}
        >
          <div
            style={{
              marginBottom: "1rem",
              color: "var(--color-secondary-600)",
            }}
          >
            <Shield size={24} />
          </div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            {t('dashboard.cards.auditManagement.title')}
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.cards.auditManagement.description')}
          </p>
        </Card>
      </div>

      {/* Recent Transactions Section */}
      <Card className="padding-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text-main)",
            }}
          >
            {recentTransactionsTitle}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            icon={<ViewAllIcon size={16} />}
            onClick={() => setIsRecentTransactionsOpen(true)}
            disabled={translatedTransactions.length === 0}
            className="cursor-pointer"
          >
            {t('dashboard.viewAll')}
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {recentTransactionsQuery.isPending && <Spinner />}

          {recentTransactionsQuery.isError && (
            <div style={{ padding: "1rem 0", color: "var(--color-error)" }}>
              {t('dashboard.loadTransactionsFailed')}
            </div>
          )}

          {!recentTransactionsQuery.isPending &&
            !recentTransactionsQuery.isError &&
            translatedTransactions.length === 0 && (
              <div
                style={{
                  padding: "1rem 0",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                {t('dashboard.noRecentTransactions')}
              </div>
            )}

          {!recentTransactionsQuery.isPending &&
            !recentTransactionsQuery.isError &&
            previewTransactions.map((transaction) => {
              const colors = getTransactionColors(transaction);

              return (
                <TransactionItem
                  key={transaction.id}
                  icon={getTransactionIcon(transaction.icon)}
                  title={transaction.title}
                  subtitle={transaction.subtitle}
                  amount={formatTransactionAmount(
                    transaction.amount,
                    transaction.currency,
                    i18n.language,
                  )}
                  status={transaction.status}
                  {...colors}
                />
              );
            })}
        </div>
      </Card>

      {isRecentTransactionsOpen && (
        <RecentTransactionsModal
          title={recentTransactionsTitle}
          transactions={translatedTransactions}
          locale={i18n.language}
          onClose={() => setIsRecentTransactionsOpen(false)}
        />
      )}
    </div>
  );
};

const RecentTransactionsModal = ({ title, transactions, locale, onClose }) => {
  const { t } = useTranslation(['accounting', 'common']);

  return (
  <div
    role="presentation"
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0, 0, 0, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recent-transactions-modal-title"
      onClick={(event) => event.stopPropagation()}
      style={{
        width: "min(720px, 100%)",
        maxHeight: "85vh",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "1rem",
        boxShadow: "0 24px 80px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h3
            id="recent-transactions-modal-title"
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text-main)",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {t('dashboard.showingTransactions', { count: transactions.length })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X size={18} />}
          onClick={onClose}
          className="cursor-pointer"
        />
      </div>

      <div
        style={{
          padding: "0 1.5rem",
          overflowY: "auto",
          maxHeight: "calc(85vh - 100px)",
        }}
      >
        {transactions.map((transaction) => {
          const colors = getTransactionColors(transaction);

          return (
            <TransactionItem
              key={transaction.id}
              icon={getTransactionIcon(transaction.icon)}
              title={transaction.title}
              subtitle={transaction.subtitle}
              amount={formatTransactionAmount(
                transaction.amount,
                transaction.currency,
                locale,
              )}
              status={transaction.status}
              {...colors}
            />
          );
        })}
      </div>
    </div>
  </div>
  );
};

const TransactionItem = ({
  icon,
  title,
  subtitle,
  amount,
  amountColor,
  bg,
  iconColor,
  status,
}) => {
  const { t } = useTranslation("common");
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  return (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 0",
      borderBottom: "1px solid var(--color-border)",
    }}
  >
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <div
        style={{
          minWidth: "2.75rem",
          height: "2.75rem",
          borderRadius: "1rem",
          background: bg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontWeight: 600,
            fontSize: "0.95rem",
            color: "var(--color-text-main)",
          }}
        >
          {title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}
          >
            {subtitle}
          </span>
        </div>
      </div>
    </div>
    <div style={{ textAlign: isRtl ? "left" : "right" }}>
      <span
        style={{
          display: "block",
          fontWeight: 700,
          fontSize: "1rem",
          color: amountColor,
        }}
      >
        {amount}
      </span>
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--color-success)",
          background: "var(--color-success-dim)",
          padding: "0.1rem 0.5rem",
          borderRadius: "1rem",
          fontWeight: 600,
        }}
      >
        {status || t('status.posted')}
      </span>
    </div>
  </div>
  );
};

export default AccountingDashboard;
