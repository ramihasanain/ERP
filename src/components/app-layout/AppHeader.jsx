import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompanyName } from '@/hooks/useCompanyName';
import { getRoleName } from '@/config/rolePermissions';
import HeaderSearchField from '@/components/app-layout/HeaderSearchField';
import HeaderIconTools from '@/components/app-layout/HeaderIconTools';
import classes from '@/components/app-layout/Sidebar.module.css';

const headerBarStyle = {
    background: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 30,
};

const rightActionsStyle = { display: 'flex', alignItems: 'center', gap: '1rem' };
const dividerStyle = { width: '1px', height: '1.5rem', background: 'var(--color-border)' };
const profileRowStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' };
const profileTextColStyle = { display: 'flex', flexDirection: 'column', lineHeight: 1.1 };
const profileNameStyle = { fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-main)' };
const profileRoleStyle = { fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' };
const signOutBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
};

const menuBtnStyle = {
    background: 'color-mix(in srgb, var(--color-text-main) 6%, var(--color-bg-surface))',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
    padding: '0.35rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

/**
 * @param {{ isNarrowLayout?: boolean; onOpenMobileNav?: () => void }} props
 */
const AppHeader = ({ isNarrowLayout = false, onOpenMobileNav }) => {
    const { t } = useTranslation(['nav', 'common']);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const companyName = useCompanyName();

    const handleSignOut = () => {
        logout();
        navigate('/auth/signin');
    };

    const narrowHeaderPad = { padding: '0 0.75rem', height: '3rem' };
    const wideHeaderPad = { padding: '0 2rem', height: '4rem' };

    const roleName = getRoleName(user);
    const roleLabel = roleName
        ? t(`roles.${roleName}`, { ns: 'common', defaultValue: roleName })
        : t('guest', { ns: 'common' });

    const avatarStyle = {
        width: isNarrowLayout ? '1.5rem' : '2rem',
        height: isNarrowLayout ? '1.5rem' : '2rem',
        background: roleName === 'admin' ? 'color-mix(in srgb, var(--color-primary-600) 22%, var(--color-bg-card))' : 'var(--color-success-dim)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: roleName === 'admin' ? 'var(--color-primary-500)' : 'var(--color-success)',
        fontWeight: 500,
        fontSize: isNarrowLayout ? '0.7rem' : '0.86rem',
    };

    const compactProfileNameStyle = isNarrowLayout ? { ...profileNameStyle, fontSize: '0.78rem' } : profileNameStyle;
    const compactProfileRoleStyle = isNarrowLayout ? { ...profileRoleStyle, fontSize: '0.65rem' } : profileRoleStyle;
    const compactRightActionsStyle = isNarrowLayout ? { ...rightActionsStyle, gap: '0.5rem' } : rightActionsStyle;
    const compactProfileRowStyle = isNarrowLayout ? { ...profileRowStyle, gap: '0.45rem', cursor: 'default' } : profileRowStyle;
    const compactDividerStyle = isNarrowLayout ? { ...dividerStyle, height: '1.15rem' } : dividerStyle;

    if (isNarrowLayout) {
        return (
            <header style={{ ...headerBarStyle, ...narrowHeaderPad }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                    <button
                        type="button"
                        style={menuBtnStyle}
                        onClick={onOpenMobileNav}
                        aria-label={t('header.openNav', { ns: 'common' })}
                        title={t('header.menu', { ns: 'common' })}
                    >
                        <Menu size={18} strokeWidth={2} />
                    </button>
                    <div className={classes.logoContainerHeader} style={{ marginBottom: 0 }}>
                        <div className={classes.logoIconHeader} />
                        <span className={classes.logoTextHeader}>{companyName}</span>
                    </div>
                </div>

                <div style={compactRightActionsStyle}>
                    <div style={compactDividerStyle} />

                    <div style={compactProfileRowStyle}>
                        <div style={avatarStyle}>{user?.initials || 'U'}</div>
                        <div style={{ ...profileTextColStyle, minWidth: 0 }}>
                            <span style={{ ...compactProfileNameStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                {user?.name || t('user', { ns: 'common' })}
                            </span>
                            <span style={compactProfileRoleStyle}>{roleLabel}</span>
                        </div>
                        <button type="button" onClick={handleSignOut} title={t('signOut')} style={signOutBtnStyle}>
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header style={{ ...headerBarStyle, ...wideHeaderPad }}>
            <HeaderSearchField compact={false} variant="header" />

            <div style={compactRightActionsStyle}>
                <HeaderIconTools compact={false} notifPanelAlign="end" layout="row" />

                <div style={compactDividerStyle} />

                <div style={compactProfileRowStyle}>
                    <div style={avatarStyle}>{user?.initials || 'U'}</div>
                    <div style={profileTextColStyle}>
                        <span style={compactProfileNameStyle}>{user?.name || t('user', { ns: 'common' })}</span>
                        <span style={compactProfileRoleStyle}>{roleLabel}</span>
                    </div>
                    <button type="button" onClick={handleSignOut} title={t('signOut')} style={signOutBtnStyle}>
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
