import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Users, UserPlus, FileText, DollarSign, Briefcase, Clock, Calendar, CreditCard, FolderOpen, FileSignature } from 'lucide-react';

const HRDashboard = () => {
    const { t } = useTranslation(['hr', 'common']);
    const navigate = useNavigate();
    const basePath = useBasePath();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{t('dashboard.title')}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t('dashboard.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button icon={<UserPlus size={18} />} onClick={() => navigate(`${basePath}/hr/employees/new`)}>{t('dashboard.addEmployee')}</Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate(`${basePath}/hr/organization`)}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Users size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('dashboard.organization')}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('dashboard.organizationDesc')}</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate(`${basePath}/hr/employees`)}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <Users size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('dashboard.employeeDirectory')}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('dashboard.employeeDirectoryDesc')}</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate(`${basePath}/hr/payroll`)}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <CreditCard size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('dashboard.payroll')}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('dashboard.payrollDesc')}</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate(`${basePath}/hr/requests`)}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileText size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('dashboard.requestsApprovals')}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('dashboard.requestsApprovalsDesc')}</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate(`${basePath}/hr/projects`)}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FolderOpen size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('dashboard.projects')}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('dashboard.projectsDesc')}</p>
                </Card>

                <Card
                    className="padding-md hoverable"
                    style={{ width: '240px', cursor: 'pointer' }}
                    onClick={() => navigate(`${basePath}/hr/contract-templates`)}
                >
                    <div style={{ marginBottom: '1rem', color: 'var(--color-primary-600)' }}>
                        <FileSignature size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{t('dashboard.contractTemplates')}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('dashboard.contractTemplatesDesc')}</p>
                </Card>
            </div>
        </div>
    );
};

export default HRDashboard;
