import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/app-layout/Sidebar';
import AppHeader from '@/components/app-layout/AppHeader';
import FinancialDrawer from '@/components/Accounting/FinancialDrawer';

const NARROW_BREAKPOINT_PX = 850;

const AdminLayout = () => {
    const [isNarrow, setIsNarrow] = useState(
        () => typeof window !== 'undefined' && window.innerWidth < NARROW_BREAKPOINT_PX
    );
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    useEffect(() => {
        const onResize = () => {
            const next = window.innerWidth < NARROW_BREAKPOINT_PX;
            setIsNarrow(next);
            if (!next) setMobileDrawerOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-body)' }}>
            {!isNarrow ? <Sidebar variant="desktop" /> : null}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <AppHeader
                    isNarrowLayout={isNarrow}
                    onOpenMobileNav={() => setMobileDrawerOpen(true)}
                />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
            {isNarrow ? (
                <Sidebar variant="drawer" open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />
            ) : null}
            <FinancialDrawer />
        </div>
    );
};

export default AdminLayout;
