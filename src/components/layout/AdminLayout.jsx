import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FinancialDrawer from '../../pages/dashboard/accounting/FinancialDrawer';

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-body)' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Header />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
            <FinancialDrawer />
        </div>
    );
};

export default AdminLayout;
