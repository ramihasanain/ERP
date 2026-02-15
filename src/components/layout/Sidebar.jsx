import React from 'react';
import { NavLink } from 'react-router-dom';
import classes from './Sidebar.module.css';
import {
    LayoutDashboard,
    Layers,
    Users,
    Package,
    Settings,
    FileText,
    LogOut,
    Tags
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/accounting', icon: <Layers size={20} />, label: 'Accounting' },
    { to: '/admin/hr', icon: <Users size={20} />, label: 'HR & Payroll' },
    { to: '/admin/inventory', icon: <Package size={20} />, label: 'Inventory' },
    { to: '/admin/reports', icon: <FileText size={20} />, label: 'Reports' },
    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
    { to: '/admin/categories', icon: <Tags size={20} />, label: 'Categories' },
];

const Sidebar = () => {
    return (
        <aside className={classes.sidebar}>
            <div className={classes.logoContainer}>
                <div className={classes.logoIcon} />
                <span className={classes.logoText}>UnifiedCore</span>
            </div>

            <nav className={classes.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => clsx(classes.navItem, isActive && classes.active)}
                    >
                        <span className={classes.icon}>{item.icon}</span>
                        <span className={classes.label}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={classes.footer}>
                <button className={classes.navItem} style={{ width: '100%', border: 'none', background: 'transparent' }}>
                    <span className={classes.icon}><LogOut size={20} /></span>
                    <span className={classes.label}>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
