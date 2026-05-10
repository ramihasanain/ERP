import React, { useEffect } from 'react';
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
import { useCompanyName } from '@/hooks/useCompanyName';
import HeaderSearchField from '@/components/app-layout/HeaderSearchField';
import HeaderIconTools from '@/components/app-layout/HeaderIconTools';

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

/**
 * @param {{ variant?: 'desktop' | 'drawer'; open?: boolean; onClose?: () => void }} props
 */
const Sidebar = ({ variant = 'desktop', open = false, onClose = () => {} }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const companyName = useCompanyName();
    const isDrawer = variant === 'drawer';

    const handleSignOut = () => {
        logout();
        navigate('/auth/signin');
    };

    useEffect(() => {
        if (!isDrawer || !open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isDrawer, open]);

    useEffect(() => {
        if (!isDrawer || !open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isDrawer, open, onClose]);

    const asideClass = [
        classes.sidebar,
        isDrawer ? classes.sidebarDrawer : classes.sidebarDesktop,
        isDrawer && open ? classes.sidebarDrawerOpen : '',
    ]
        .filter(Boolean)
        .join(' ');

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
                        className={({ isActive }) => `${classes.navItem} ${isActive ? classes.active : ''}`}
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
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        onClick={handleSignOut}
                    >
                        <span className={classes.icon}><LogOut size={20} /></span>
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
                    className={`${classes.backdrop} ${open ? classes.backdropVisible : ''}`}
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

export default Sidebar;
