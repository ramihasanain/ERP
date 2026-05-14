export const MODULE_KEYS = {
  ACCOUNTING: "accounting",
  AUDITOR_CHANGES: "auditor-changes",
  HR: "hr",
  INVENTORY: "inventory",
  REPORTS: "reports",
  SETTINGS: "settings",
  CATEGORIES: "categories",
};

const ALL_MODULES = Object.values(MODULE_KEYS);

const ADMIN_ONLY_MODULES = [
  MODULE_KEYS.SETTINGS,
  MODULE_KEYS.CATEGORIES,
  MODULE_KEYS.REPORTS,
];
const VIEWER_MODULES = ALL_MODULES.filter(
  (m) => !ADMIN_ONLY_MODULES.includes(m),
);

export const ROLE_ACCESS = {
  admin: {
    modules: ALL_MODULES,
    canModify: true,
  },
  Accountant: {
    modules: [MODULE_KEYS.ACCOUNTING, MODULE_KEYS.AUDITOR_CHANGES],
    canModify: true,
  },
  Auditor: {
    modules: [MODULE_KEYS.AUDITOR_CHANGES],
    canModify: true,
  },
  "HR Manager": {
    modules: [MODULE_KEYS.HR],
    canModify: true,
  },
  "Inventory Manager": {
    modules: [MODULE_KEYS.INVENTORY],
    canModify: true,
  },
  Viewer: {
    modules: VIEWER_MODULES,
    canModify: false,
  },
};

export const getRoleName = (user) =>
  typeof user?.role === "string" ? user.role : user?.role?.name;

export const getRoleAccess = (user) => {
  const roleName = getRoleName(user);
  return ROLE_ACCESS[roleName] || { modules: [], canModify: false };
};

export const canAccessModule = (user, moduleKey) => {
  const access = getRoleAccess(user);
  return access.modules.includes(moduleKey);
};

export const canModify = (user) => {
  const access = getRoleAccess(user);
  return access.canModify;
};
