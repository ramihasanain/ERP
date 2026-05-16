import fs from 'fs';

let admin = fs.readFileSync('src/components/Dashboard/AdminDashboard.jsx', 'utf8');
if (!admin.includes('useTranslation')) {
  admin = admin.replace(
    'import React, { useState, useMemo, useCallback, useLayoutEffect } from "react";',
    'import React, { useState, useMemo, useCallback, useLayoutEffect } from "react";\nimport { useTranslation } from "react-i18next";',
  );
}
admin = admin.replace(/const MONTH_NAMES = \[[\s\S]*?\];\n\n/, '');
admin = admin.replace(
  'const aggregateData = (data, mode) => {',
  `const formatChartMonthLabel = (year, month, locale) => {
  const dt = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(dt);
};
const formatChartWeekLabel = (dateKey, locale) => {
  const dt = new Date(dateKey);
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(dt);
};

const aggregateData = (data, mode, locale) => {`,
);
admin = admin.replace(
  '      label = `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`;',
  '      label = formatChartMonthLabel(y, m, locale);',
);
admin = admin.replace(
  '      label = `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]}`;',
  '      label = formatChartWeekLabel(key, locale);',
);
if (!admin.includes('const { t, i18n }')) {
  admin = admin.replace(
    'const AdminDashboard = () => {\n  const navigate = useNavigate();',
    'const AdminDashboard = () => {\n  const { t, i18n } = useTranslation(["dashboard", "common"]);\n  const navigate = useNavigate();',
  );
}
admin = admin.replace(
  'return aggregateData(filtered, effectiveMode);',
  'return aggregateData(filtered, effectiveMode, i18n.language);',
);
const adminReplacements = [
  ['Failed to load dashboard data.', "{t('dashboard:admin.loadFailed')}"],
  ['>Dashboard</h1>', ">{t('dashboard:admin.title')}</h1>"],
  ['Company overview across all departments', "{t('dashboard:admin.subtitle')}"],
  ['data?.total_revenue?.title || "Total Revenue"', "data?.total_revenue?.title || t('dashboard:admin.totalRevenue')"],
  ['data?.employees?.title || "Employees"', "data?.employees?.title || t('dashboard:admin.employees')"],
  ['data?.inventory_items?.title || "Inventory Items"', "data?.inventory_items?.title || t('dashboard:admin.inventoryItems')"],
  ['data?.open_orders?.title || "Open Orders"', "data?.open_orders?.title || t('dashboard:admin.openOrders')"],
  ['`${data.inventory_items.low_stock} low stock`', "t('dashboard:admin.lowStock', { count: data.inventory_items.low_stock })"],
  ['data?.revenue_vs_expenses?.title || "Revenue vs Expenses"', "data?.revenue_vs_expenses?.title || t('dashboard:admin.revenueVsExpenses')"],
  ['? "Weekly"', "? t('dashboard:admin.weekly')"],
  ['? "Monthly"', "? t('dashboard:admin.monthly')"],
  [': "Yearly"', ": t('dashboard:admin.yearly')"],
  ['>From</span>', ">{t('dashboard:admin.from')}</span>"],
  ['>To</span>', ">{t('dashboard:admin.to')}</span>"],
  ['>Clear</button>', ">{t('common:actions.clear')}</button>"],
  ['name="Revenue"', 'name={t("dashboard:admin.revenue")}'],
  ['name="Expenses"', 'name={t("dashboard:admin.expenses")}'],
  ['segment?.label || "Unknown"', "segment?.label || t('dashboard:admin.unknown')"],
  ['item?.label || "General"', "item?.label || t('dashboard:admin.general')"],
  ['data?.finance_and_accounting?.title || "Finance & Accounting"', "data?.finance_and_accounting?.title || t('dashboard:admin.financeAndAccounting')"],
  ['label: "Cash Balance"', "label: t('dashboard:admin.cashBalance')"],
  ['label: "Receivables"', "label: t('dashboard:admin.receivables')"],
  ['label: "Payables"', "label: t('dashboard:admin.payables')"],
  ['label: "Net Profit"', "label: t('dashboard:admin.netProfit')"],
  ['data?.human_resources?.title || "Human Resources"', "data?.human_resources?.title || t('dashboard:admin.humanResources')"],
  ['label: "Total Employees"', "label: t('dashboard:admin.totalEmployees')"],
  ['label: "On Leave Today"', "label: t('dashboard:admin.onLeaveToday')"],
  ['label: "Open Positions"', "label: t('dashboard:admin.openPositions')"],
  ['label: "Payroll (Monthly)"', "label: t('dashboard:admin.payrollMonthly')"],
  ['data?.inventory_and_warehouse?.title || "Inventory & Warehouse"', "data?.inventory_and_warehouse?.title || t('dashboard:admin.inventoryAndWarehouse')"],
  ['label: "Total Items"', "label: t('dashboard:admin.totalItems')"],
  ['label: "Stock Value"', "label: t('dashboard:admin.stockValue')"],
  ['label: "Low Stock Items"', "label: t('dashboard:admin.lowStockItems')"],
  ['label: "Pending POs"', "label: t('dashboard:admin.pendingPOs')"],
  ['data?.sales_and_crm?.title || "Sales & CRM"', "data?.sales_and_crm?.title || t('dashboard:admin.salesAndCrm')"],
  ['label: "Active Orders"', "label: t('dashboard:admin.activeOrders')"],
  ['label: "Monthly Sales"', "label: t('dashboard:admin.monthlySales')"],
  ['label: "Customers"', "label: t('dashboard:admin.customers')"],
  ['label: "Avg. Order Value"', "label: t('dashboard:admin.avgOrderValue')"],
  ['data?.recent_activity?.title || "Recent Activity"', "data?.recent_activity?.title || t('dashboard:admin.recentActivity')"],
];
for (const [a, b] of adminReplacements) {
  if (!admin.includes(a)) console.log('admin miss', a);
  else admin = admin.split(a).join(b);
}
fs.writeFileSync('src/components/Dashboard/AdminDashboard.jsx', admin);

let cat = fs.readFileSync('src/components/CategoryManagement/CategoryManagement.jsx', 'utf8');
if (!cat.includes('useTranslation')) {
  cat = cat.replace(
    "import React, { useMemo, useState } from 'react';",
    "import React, { useMemo, useState } from 'react';\nimport { useTranslation } from 'react-i18next';",
  );
  cat = cat.replace(
    "import { toast } from 'sonner';",
    "import { toast } from 'sonner';\nimport { translateApiError } from '@/utils/translateApiError';",
  );
}
if (!cat.includes("useTranslation(['settings'")) {
  cat = cat.replace(
    'const CategoryManagement = () => {',
    "const CategoryManagement = () => {\n    const { t } = useTranslation(['settings', 'common']);",
  );
}
const catReplacements = [
  ["toast.success('Category updated successfully.')", "toast.success(t('settings:categoryManagement.toast.updated'))"],
  ["toast.success('Category created successfully.')", "toast.success(t('settings:categoryManagement.toast.created'))"],
  [
    "const message = error?.response?.data?.detail || 'Failed to save category.';\n            toast.error(message);",
    "toast.error(translateApiError(error, 'settings:categoryManagement.toast.saveFailed'));",
  ],
  ["toast.success('Category deleted successfully.')", "toast.success(t('settings:categoryManagement.toast.deleted'))"],
  [
    "const message = error?.response?.data?.detail || 'Failed to delete category.';\n            toast.error(message);",
    "toast.error(translateApiError(error, 'settings:categoryManagement.toast.deleteFailed'));",
  ],
  ["toast.success('Categories refreshed.')", "toast.success(t('settings:categoryManagement.toast.refreshed'))"],
  ["toast.error('Refresh failed. Please try again.')", "toast.error(t('settings:categoryManagement.toast.refreshFailed'))"],
  ['>Category Management</h1>', ">{t('settings:categoryManagement.title')}</h1>"],
  ['Manage all category dropdowns used across the system.', "{t('settings:categoryManagement.subtitle')}"],
  ['Could not load categories data.', "{t('settings:categoryManagement.loadError')}"],
  ['>Retry</Button>', ">{t('common:actions.retry')}</Button>"],
  ['No category groups configured yet.', "{t('settings:categoryManagement.noGroups')}"],
  ["type.name || 'Unnamed group'", "type.name || t('settings:categoryManagement.unnamedGroup')"],
  [
    "list.length === 1 ? '1 category' : `${list.length} categories`",
    "t('settings:categoryManagement.categoryCount', { count: list.length })",
  ],
  ['No categories yet. Use + to add one.', "{t('settings:categoryManagement.noCategoriesHint')}"],
  ['>Uncategorized</motion.div>', ">{t('settings:categoryManagement.uncategorized')}</div>"],
  [
    "uncategorized.length === 1 ? '1 category' : `${uncategorized.length} categories`",
    "t('settings:categoryManagement.categoryCount', { count: uncategorized.length })",
  ],
  [
    "editingCategory ? 'Edit Category' : 'Add Category'",
    "editingCategory ? t('settings:categoryManagement.editCategory') : t('settings:categoryManagement.addCategory')",
  ],
  ['>Category Name *</label>', ">{t('settings:categoryManagement.categoryName')}</label>"],
  ["required: 'Category name is required.'", "required: t('settings:categoryManagement.validation.nameRequired')"],
  ['placeholder="Enter category name"', "placeholder={t('settings:categoryManagement.categoryNamePlaceholder')}"],
  ['>Category Type *</label>', ">{t('settings:categoryManagement.categoryType')}</label>"],
  ["required: 'Category type is required.'", "required: t('settings:categoryManagement.validation.typeRequired')"],
  ['emptyOptionLabel="Select category type"', "emptyOptionLabel={t('settings:categoryManagement.selectCategoryType')}"],
  ["t.name || 'Unnamed type'", "typeOption.name || t('settings:categoryManagement.unnamedType')"],
  ['<option value="">Select category type</option>', '<option value="">{t(\'settings:categoryManagement.selectCategoryType\')}</option>'],
  ['>Description</label>', ">{t('settings:categoryManagement.description')}</label>"],
  ['placeholder="Enter description"', "placeholder={t('settings:categoryManagement.descriptionPlaceholder')}"],
  ['>Active Category</label>', ">{t('settings:categoryManagement.activeCategory')}</label>"],
  ['>Cancel</Button>', ">{t('common:actions.cancel')}</Button>"],
  ["editingCategory ? 'Update' : 'Create'", "editingCategory ? t('common:actions.update') : t('common:actions.create')"],
  ['title="Delete Category"', "title={t('settings:categoryManagement.deleteTitle')}"],
  [
    '`Are you sure you want to delete "${deleteTarget?.name || \'this category\'}"? This action cannot be undone.`',
    "t('settings:categoryManagement.deleteMessage', { name: deleteTarget?.name || t('settings:categoryManagement.thisCategory') })",
  ],
  ['confirmText="Delete"', "confirmText={t('common:actions.delete')}"],
  ['cancelText="Cancel"', "cancelText={t('common:actions.cancel')}"],
  ['title="Edit"', "title={t('common:actions.edit')}"],
  [
    'aria-label={`Add category to ${type.name || \'group\'}`}',
    "aria-label={t('settings:categoryManagement.addToGroup', { name: type.name || t('settings:categoryManagement.unnamedGroup') })}",
  ],
];
for (const [a, b] of catReplacements) {
  if (!cat.includes(a)) console.log('cat miss', a.slice(0, 70));
  else cat = cat.split(a).join(b);
}
// fix accidental motion.div in script
cat = cat.replace('>Uncategorized</motion.div>', '>{t(\'settings:categoryManagement.uncategorized\')}</motion.div>');
cat = cat.replace(/motion\.div/g, 'div');
// fix typeOption rename - revert map callback if broken
cat = cat.replace(
  'categoryTypes.map((typeOption) => (\n                                            <option key={typeOption.id} value={typeOption.id}>\n                                                {typeOption.name || t(\'settings:categoryManagement.unnamedType\')}',
  "categoryTypes.map((typeRow) => (\n                                            <option key={typeRow.id} value={typeRow.id}>\n                                                {typeRow.name || t('settings:categoryManagement.unnamedType')}",
);
fs.writeFileSync('src/components/CategoryManagement/CategoryManagement.jsx', cat);
console.log('done');
