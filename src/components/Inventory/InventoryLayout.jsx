import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowRightLeft,
  ShoppingCart,
  Users,
  FileText,
} from "lucide-react";
import Button from "@/components/Shared/Button";
import { useBasePath } from "@/hooks/useBasePath";

const InventoryLayout = () => {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const [isNarrowScreen, setIsNarrowScreen] = useState(
    () => window.innerWidth < 1100,
  );

  useEffect(() => {
    const onResize = () => setIsNarrowScreen(window.innerWidth < 1100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const tabs = [
    {
      path: `${basePath}/inventory/dashboard`,
      label: "Overview",
      icon: <LayoutDashboard size={18} />,
    },
    {
      path: `${basePath}/inventory/items`,
      label: "Items",
      icon: <Package size={18} />,
    },
    {
      path: `${basePath}/inventory/warehouses`,
      label: "Warehouses",
      icon: <Warehouse size={18} />,
    },
    {
      path: `${basePath}/inventory/transactions`,
      label: "Transactions",
      icon: <ArrowRightLeft size={18} />,
    },
    {
      path: `${basePath}/inventory/purchase-orders`,
      label: "Purchase Orders",
      icon: <ShoppingCart size={18} />,
    },
    {
      path: `${basePath}/inventory/invoices`,
      label: "Bills",
      icon: <FileText size={18} />,
    },
    {
      path: `${basePath}/inventory/vendors`,
      label: "Vendors",
      icon: <Users size={18} />,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isNarrowScreen ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isNarrowScreen ? "flex-start" : "center",
            marginBottom: "1rem",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "var(--color-text-main)",
              }}
            >
              Inventory Management
            </h1>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Track stock, manage warehouses, and control procurement.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignSelf: isNarrowScreen ? "flex-end" : "auto",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outline"
              size={isNarrowScreen ? "sm" : undefined}
              onClick={() => navigate(`${basePath}/inventory/items/new`)}
            >
              + New Item
            </Button>
            <Button
              size={isNarrowScreen ? "sm" : undefined}
              onClick={() =>
                navigate(`${basePath}/inventory/transactions/receipt`)
              }
            >
              + Receive Goods
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="inventory-tabs-scroll"
          style={{
            borderBottom: "1px solid var(--color-border)",
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "2rem",
              width: "max-content",
              minWidth: "100%",
            }}
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 0",
                  borderBottom: isActive
                    ? "2px solid var(--color-primary-600)"
                    : "2px solid transparent",
                  color: isActive
                    ? "var(--color-primary-600)"
                    : "var(--color-text-secondary)",
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                })}
              >
                {tab.icon}
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default InventoryLayout;
