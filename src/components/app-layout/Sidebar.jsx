import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import classes from '@/components/app-layout/Sidebar.module.css';
import {
    LayoutDashboard,
    Layers,
    Users,
    Package,
    Settings,
    FileText,
    LogOut,
    Tags,
    Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/accounting', icon: <Layers size={20} />, label: 'Accounting' },
    { to: '/admin/auditor-adjustments', icon: <Shield size={20} />, label: 'Auditor Changes' },
    { to: '/admin/hr', icon: <Users size={20} />, label: 'HR & Payroll' },
    { to: '/admin/inventory', icon: <Package size={20} />, label: 'Inventory' },
    { to: '/admin/reports', icon: <FileText size={20} />, label: 'Reports' },
    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
    { to: '/admin/categories', icon: <Tags size={20} />, label: 'Categories' },
];

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const companyName = useMemo(() => {
        try {
            const authUserRaw = localStorage.getItem('auth_user');
            if (!authUserRaw) return 'UnifiedCore';
            const parsed = JSON.parse(authUserRaw);
            return parsed?.user?.company_name || 'UnifiedCore';
        } catch (error) {
            return 'UnifiedCore';
        }
    }, []);

    const handleSignOut = () => {
        logout();
        navigate('/auth/signin');
    };

    return (
        <aside className={classes.sidebar}>
            <div className={classes.logoContainer}>
                <div className={classes.logoIcon} />
                <span className={classes.logoText}>{companyName}</span>
            </div>

            <nav className={classes.nav}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `${classes.navItem} ${isActive ? classes.active : ''}`}
                    >
                        <span className={classes.icon}>{item.icon}</span>
                        <span className={classes.label}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={classes.footer}>
                <button
                    className={classes.navItem}
                    style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    onClick={handleSignOut}
                >
                    <span className={classes.icon}><LogOut size={20} /></span>
                    <span className={classes.label}>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
