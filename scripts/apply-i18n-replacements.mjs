import fs from 'fs';
import path from 'path';

const HOOK_INVENTORY = "    const { t } = useTranslation(['inventory', 'common']);\n";
const HOOK_PROCUREMENT = "    const { t } = useTranslation(['procurement', 'common']);\n";

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.jsx')) files.push(p);
  }
  return files;
}

function addHook(content, hook) {
  if (content.includes('const { t }')) return content;
  const patterns = [
    /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{\r?\n)/,
    /(const\s+\w+\s*=\s*\(\)\s*=>\s*\{\r?\n)/,
    /(function\s+\w+\s*\([^)]*\)\s*\{\r?\n)/,
  ];
  for (const re of patterns) {
    const m = content.match(re);
    if (m) return content.replace(re, m[0] + hook);
  }
  return content;
}

function apply(file, hook, pairs) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('react-i18next')) return false;
  let changed = false;
  const before = content;
  content = addHook(content, hook);
  for (const [from, to] of pairs) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (content !== before) {
    fs.writeFileSync(file, content);
    return true;
  }
  return false;
}

const root = process.cwd();
const invDir = path.join(root, 'src/components/Inventory');
const procDir = path.join(root, 'src/components/Procurement');

const inventoryFiles = walk(invDir).filter((f) => !f.includes('BillPayment'));
const procurementFiles = walk(procDir).filter((f) => !f.endsWith('BillPaymentModal.jsx'));

// Warehouses-specific bulk
const warehousesPairs = [
  ['toast.success("Warehouse updated successfully.");', "toast.success(t('warehouses.updateSuccess'));"],
  ['toast.success("Warehouse created successfully.");', "toast.success(t('warehouses.createSuccess'));"],
  ['error?.response?.data?.detail || "Failed to save warehouse."', "translateApiError(error, 'inventory:warehouses.saveFailed')"],
  ['toast.success("Warehouse deleted successfully.");', "toast.success(t('warehouses.deleteSuccess'));"],
  ['error?.response?.data?.detail || "Failed to delete warehouse."', "translateApiError(error, 'inventory:warehouses.deleteFailed')"],
  ['toast.success("Warehouses refreshed.");', "toast.success(t('warehouses.refreshSuccess'));"],
  ['toast.error("Refresh failed. Please try again.");', "toast.error(t('warehouses.refreshFailed'));"],
  ['<h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Warehouses</h1>', '<h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>{t("warehouses.title")}</h1>'],
  ['Manage physical storage locations.', '{t("warehouses.subtitle")}'],
  ['Add Warehouse', '{t("warehouses.addWarehouse")}'],
  ['Could not load warehouses data.', '{t("warehouses.loadFailed")}'],
  ['Retry', '{t("common:actions.retry")}'],
  ['wh.location || "No location provided"', 'wh.location || t("warehouses.noLocation")'],
  ['title="View"', 'title={t("common:actions.view")}'],
  ['"Unassigned"', 't("warehouses.unassigned")'],
  ['title={editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}', 'title={editingWarehouse ? t("warehouses.editWarehouse") : t("warehouses.addWarehouseModal")}'],
  ['required: "Warehouse name is required."', 'required: t("warehouses.nameRequired")'],
  ['placeholder="Enter warehouse name"', 'placeholder={t("warehouses.namePlaceholder")}'],
  ['required: "Warehouse location is required."', 'required: t("warehouses.locationRequired")'],
  ['placeholder="Enter location"', 'placeholder={t("warehouses.locationPlaceholder")}'],
  ['placeholder="Select manager"', 'placeholder={t("warehouses.selectManager")}'],
  ['? "Loading..."', '? t("common:actions.loading")'],
  [': "No employees found"', ': t("warehouses.noEmployees")'],
  ['{editingWarehouse ? "Update" : "Create"}', '{editingWarehouse ? t("common:actions.update") : t("common:actions.create")}'],
  ['title="Warehouse Details"', 'title={t("warehouses.details")}'],
  ['Warehouse details unavailable.', '{t("warehouses.detailsUnavailable")}'],
  ['<span style={detailLabelStyle}>Name</span>', '<span style={detailLabelStyle}>{t("warehouses.nameLabel")}</span>'],
  ['<span style={detailLabelStyle}>Location</span>', '<span style={detailLabelStyle}>{t("warehouses.locationLabel")}</span>'],
  ['<span style={detailLabelStyle}>Manager</span>', '<span style={detailLabelStyle}>{t("warehouses.manager")}</span>'],
  ['title="Delete Warehouse"', 'title={t("warehouses.deleteTitle")}'],
  ['confirmText="Delete"', 'confirmText={t("common:actions.delete")}'],
  ['cancelText="Cancel"', 'cancelText={t("common:actions.cancel")}'],
  ['fullName: editingWarehouse?.managerName?.trim() || "Current manager"', 'fullName: editingWarehouse?.managerName?.trim() || t("warehouses.currentManager")'],
  ['fullName: `${firstName} ${lastName}`.trim() || email || "Unknown"', 'fullName: `${firstName} ${lastName}`.trim() || email || t("warehouses.unknown")'],
  ['Manager:', '{t("warehouses.manager")}'],
];

const whFile = path.join(invDir, 'Warehouses.jsx');
let wh = fs.readFileSync(whFile, 'utf8');
if (!wh.includes('translateApiError')) {
  wh = wh.replace("import { toast } from \"sonner\";", "import { toast } from \"sonner\";\nimport translateApiError from '@/utils/translateApiError';");
}
wh = addHook(wh, HOOK_INVENTORY);
for (const [from, to] of warehousesPairs) {
  wh = wh.split(from).join(to);
}
// fix toast.error(message) for warehouses
wh = wh.replace(
  /const message =\s*translateApiError\(error, 'inventory:warehouses\.saveFailed'\);\s*toast\.error\(message\);/g,
  "toast.error(translateApiError(error, 'inventory:warehouses.saveFailed'));"
);
wh = wh.replace(
  /const message =\s*translateApiError\(error, 'inventory:warehouses\.deleteFailed'\);\s*toast\.error\(message\);/g,
  "toast.error(translateApiError(error, 'inventory:warehouses.deleteFailed'));"
);
fs.writeFileSync(whFile, wh);
console.log('updated Warehouses.jsx');
