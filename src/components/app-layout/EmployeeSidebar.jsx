import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import classes from "@/components/app-layout/Sidebar.module.css";
import {
  LayoutDashboard,
  Layers,
  Users,
  Package,
  Settings,
  FileText,
  LogOut,
  Tags,
  Shield,
  ClipboardList,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { MODULE_KEYS } from "@/config/rolePermissions";
import { useEmployeeCompanyName } from "@/hooks/useEmployeeCompanyName";
import { clearTenantDomain } from "@/services/auth";
import HeaderSearchField from "@/components/app-layout/HeaderSearchField";
import HeaderIconTools from "@/components/app-layout/HeaderIconTools";

const allNavItems = [
  {
    to: "/employee/dashboard",
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    module: null,
  },
  {
    to: "/employee/requests",
    icon: <ClipboardList size={20} />,
    label: "My Requests",
    module: null,
  },
  {
    to: "/employee/payslips",
    icon: <Receipt size={20} />,
    label: "Payslips",
    module: null,
  },
  {
    to: "/employee/accounting",
    icon: <Layers size={20} />,
    label: "Accounting",
    module: MODULE_KEYS.ACCOUNTING,
  },
  {
    to: "/employee/auditor-adjustments",
    icon: <Shield size={20} />,
    label: "Auditor Changes",
    module: MODULE_KEYS.AUDITOR_CHANGES,
  },
  {
    to: "/employee/hr",
    icon: <Users size={20} />,
    label: "HR & Payroll",
    module: MODULE_KEYS.HR,
  },
  {
    to: "/employee/inventory",
    icon: <Package size={20} />,
    label: "Inventory",
    module: MODULE_KEYS.INVENTORY,
  },
  {
    to: "/employee/reports",
    icon: <FileText size={20} />,
    label: "Reports",
    module: MODULE_KEYS.REPORTS,
  },
  {
    to: "/employee/settings",
    icon: <Settings size={20} />,
    label: "Settings",
    module: MODULE_KEYS.SETTINGS,
  },
  {
    to: "/employee/categories",
    icon: <Tags size={20} />,
    label: "Categories",
    module: MODULE_KEYS.CATEGORIES,
  },
];

const EmployeeSidebar = ({
  variant = "desktop",
  open = false,
  onClose = () => {},
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const companyName = useEmployeeCompanyName();
  const { canAccessModule } = useRoleAccess();
  const isDrawer = variant === "drawer";

  const navItems = allNavItems.filter(
    (item) => item.module === null || canAccessModule(item.module),
  );

  const handleSignOut = () => {
    logout();
    clearTenantDomain();
    navigate("/auth/signin");
  };

  useEffect(() => {
    if (!isDrawer || !open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawer, open]);

  useEffect(() => {
    if (!isDrawer || !open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDrawer, open, onClose]);

  const asideClass = [
    classes.sidebar,
    isDrawer ? classes.sidebarDrawer : classes.sidebarDesktop,
    isDrawer && open ? classes.sidebarDrawerOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {!isDrawer ? (
        <div className={classes.logoContainer}>
          <div className={classes.logoIcon} />
          <span className={classes.logoText}>{companyName}</span>
        </div>
      ) : null}

      {isDrawer ? (
        <div className={classes.mobileDrawerTools}>
          <HeaderSearchField compact variant="drawer" />
          <HeaderIconTools compact notifPanelAlign="start" layout="stack" />
        </div>
      ) : null}

      <nav className={classes.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${classes.navItem} ${isActive ? classes.active : ""}`
            }
            onClick={() => isDrawer && onClose()}
          >
            <span className={classes.icon}>{item.icon}</span>
            <span className={classes.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {!isDrawer ? (
        <div className={classes.footer}>
          <button
            type="button"
            className={classes.navItem}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
            onClick={handleSignOut}
          >
            <span className={classes.icon}>
              <LogOut size={20} />
            </span>
            <span className={classes.label}>Sign Out</span>
          </button>
        </div>
      ) : null}
    </>
  );

  if (isDrawer) {
    return (
      <>
        <div
          className={`${classes.backdrop} ${open ? classes.backdropVisible : ""}`}
          onClick={onClose}
          aria-hidden="true"
        />
        <aside className={asideClass} aria-hidden={!open}>
          {inner}
        </aside>
      </>
    );
  }

  return <aside className={asideClass}>{inner}</aside>;
};

export default EmployeeSidebar;
