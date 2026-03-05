import React, { createContext, useContext, useState } from 'react';

const PermissionsContext = createContext();

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};

// All available modules in the system
const SYSTEM_MODULES = [
    { id: 'dashboard', label: 'Dashboard', group: 'General' },
    { id: 'accounting', label: 'Accounting', group: 'Finance' },
    { id: 'coa', label: 'Chart of Accounts', group: 'Finance' },
    { id: 'journal', label: 'Journal Entries', group: 'Finance' },
    { id: 'invoices', label: 'Sales Invoices', group: 'Finance' },
    { id: 'bank', label: 'Bank & Cash', group: 'Finance' },
    { id: 'bank-import', label: 'Bank Import', group: 'Finance' },
    { id: 'assets', label: 'Fixed Assets', group: 'Finance' },
    { id: 'cost-centers', label: 'Cost Centers', group: 'Finance' },
    { id: 'customers', label: 'Customers', group: 'Finance' },
    { id: 'products-services', label: 'Products & Services', group: 'Finance' },
    { id: 'vendor-payments', label: 'Vendor Payments', group: 'Finance' },
    { id: 'trial-balance', label: 'Trial Balance', group: 'Finance' },
    { id: 'reports', label: 'Reports', group: 'Finance' },
    { id: 'hr', label: 'HR Dashboard', group: 'HR' },
    { id: 'employees', label: 'Employee Directory', group: 'HR' },
    { id: 'organization', label: 'Organization', group: 'HR' },
    { id: 'payroll', label: 'Payroll', group: 'HR' },
    { id: 'attendance', label: 'Attendance', group: 'HR' },
    { id: 'requests', label: 'Requests & Approvals', group: 'HR' },
    { id: 'projects', label: 'Projects', group: 'HR' },
    { id: 'contract-templates', label: 'Contract Templates', group: 'HR' },
    { id: 'inventory', label: 'Inventory', group: 'Operations' },
    { id: 'inventory-items', label: 'Inventory Items', group: 'Operations' },
    { id: 'purchase-orders', label: 'Purchase Orders', group: 'Operations' },
    { id: 'goods-receipt', label: 'Goods Receipt', group: 'Operations' },
    { id: 'categories', label: 'Categories', group: 'General' },
    { id: 'settings', label: 'Settings', group: 'General' },
];

const PERMISSION_TYPES = ['view', 'edit', 'delete'];

// Default roles with permissions
const DEFAULT_ROLES = [
    {
        id: 'ROLE-001',
        name: 'Super Admin',
        description: 'Full access to all modules',
        isSystem: true,
        permissions: SYSTEM_MODULES.reduce((acc, mod) => {
            acc[mod.id] = { view: true, edit: true, delete: true };
            return acc;
        }, {})
    },
    {
        id: 'ROLE-002',
        name: 'Accountant',
        description: 'Access to finance modules',
        isSystem: false,
        permissions: SYSTEM_MODULES.reduce((acc, mod) => {
            if (mod.group === 'Finance') {
                acc[mod.id] = { view: true, edit: true, delete: false };
            } else if (mod.id === 'dashboard') {
                acc[mod.id] = { view: true, edit: false, delete: false };
            } else {
                acc[mod.id] = { view: false, edit: false, delete: false };
            }
            return acc;
        }, {})
    },
    {
        id: 'ROLE-003',
        name: 'HR Manager',
        description: 'Access to HR and payroll modules',
        isSystem: false,
        permissions: SYSTEM_MODULES.reduce((acc, mod) => {
            if (mod.group === 'HR') {
                acc[mod.id] = { view: true, edit: true, delete: true };
            } else if (mod.id === 'dashboard') {
                acc[mod.id] = { view: true, edit: false, delete: false };
            } else {
                acc[mod.id] = { view: false, edit: false, delete: false };
            }
            return acc;
        }, {})
    },
    {
        id: 'ROLE-004',
        name: 'Viewer',
        description: 'Read-only access to all modules',
        isSystem: false,
        permissions: SYSTEM_MODULES.reduce((acc, mod) => {
            acc[mod.id] = { view: true, edit: false, delete: false };
            return acc;
        }, {})
    }
];

export const PermissionsProvider = ({ children }) => {
    const [roles, setRoles] = useState(DEFAULT_ROLES);

    // Map employee IDs to role IDs
    const [employeeRoles, setEmployeeRoles] = useState({
        'EMP-001': 'ROLE-001', // John Doe = Super Admin
        'EMP-002': 'ROLE-004', // Sarah = Viewer
    });

    // CRUD Roles
    const addRole = (role) => {
        const newRole = {
            ...role,
            id: `ROLE-${Date.now()}`,
            isSystem: false,
            permissions: role.permissions || SYSTEM_MODULES.reduce((acc, mod) => {
                acc[mod.id] = { view: false, edit: false, delete: false };
                return acc;
            }, {})
        };
        setRoles(prev => [...prev, newRole]);
        return newRole;
    };

    const updateRole = (roleId, updates) => {
        setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updates } : r));
    };

    const deleteRole = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (role?.isSystem) return;
        setRoles(prev => prev.filter(r => r.id !== roleId));
        // Remove assignments for this role
        setEmployeeRoles(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(empId => {
                if (next[empId] === roleId) delete next[empId];
            });
            return next;
        });
    };

    const assignRole = (employeeId, roleId) => {
        setEmployeeRoles(prev => ({ ...prev, [employeeId]: roleId }));
    };

    const removeRole = (employeeId) => {
        setEmployeeRoles(prev => {
            const next = { ...prev };
            delete next[employeeId];
            return next;
        });
    };

    const getEmployeeRole = (employeeId) => {
        const roleId = employeeRoles[employeeId];
        return roles.find(r => r.id === roleId) || null;
    };

    const hasPermission = (employeeId, moduleId, permType = 'view') => {
        const role = getEmployeeRole(employeeId);
        if (!role) return false;
        return role.permissions?.[moduleId]?.[permType] || false;
    };

    const getEmployeesWithRole = (roleId) => {
        return Object.entries(employeeRoles)
            .filter(([, rId]) => rId === roleId)
            .map(([empId]) => empId);
    };

    return (
        <PermissionsContext.Provider value={{
            roles,
            employeeRoles,
            systemModules: SYSTEM_MODULES,
            permissionTypes: PERMISSION_TYPES,
            addRole,
            updateRole,
            deleteRole,
            assignRole,
            removeRole,
            getEmployeeRole,
            hasPermission,
            getEmployeesWithRole
        }}>
            {children}
        </PermissionsContext.Provider>
    );
};
