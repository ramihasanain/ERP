import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useCustomPost } from '@/hooks/useMutation';
import useCustomQuery from '@/hooks/useQuery';
import ChartOfAccountsHeader from './ChartOfAccountsHeader';
import ChartOfAccountsFilters from './ChartOfAccountsFilters';
import ChartOfAccountsTable from './ChartOfAccountsTable';
import NewAccountModal from './NewAccountModal';
import { collectParentIds, flattenAccounts, normalizeTreeResponse } from './chartOfAccounts.data';

const ChartOfAccounts = () => {
    const { language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterSource, setFilterSource] = useState('All');
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalType, setSelectedModalType] = useState('');

    const treeUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (filterType !== 'All') {
            params.set('account_type', filterType);
        }
        if (filterSource === 'System') {
            params.set('is_system_account', 'true');
        } else if (filterSource === 'Custom') {
            params.set('is_system_account', 'false');
        }
        const queryString = params.toString();
        return `/accounting/accounts/tree/${queryString ? `?${queryString}` : ''}`;
    }, [filterType, filterSource]);

    const treeQueryKey = useMemo(
        () => ['accounting-accounts-tree', filterType, filterSource],
        [filterType, filterSource]
    );

    const treeQuery = useCustomQuery(treeUrl, treeQueryKey, {
        select: normalizeTreeResponse,
    });

    const createAccountMutation = useCustomPost('/accounting/accounts/create/', [treeQueryKey]);
    const treeNodes = useMemo(() => treeQuery.data ?? [], [treeQuery.data]);

    const allAccounts = useMemo(() => flattenAccounts(treeNodes), [treeNodes]);
    const accountById = useMemo(
        () => new Map(allAccounts.map((account) => [account.id, account])),
        [allAccounts]
    );

    const accountTypesQuery = useCustomQuery('/api/shared/account-types/', ['shared-account-types'], {
        select: (response) => {
            const source = Array.isArray(response)
                ? response
                : Array.isArray(response?.results)
                    ? response.results
                    : [];

            return source
                .map((type) => ({
                    id: type?.id || type?.uuid || '',
                    label: type?.name || type?.title || '',
                }))
                .filter((type) => type.id && type.label)
                .sort((a, b) => a.label.localeCompare(b.label));
        },
    });

    const accountTypes = useMemo(() => accountTypesQuery.data ?? [], [accountTypesQuery.data]);

    const parentAccountsUrl = useMemo(() => {
        if (!selectedModalType) return null;
        const params = new URLSearchParams();
        params.set('type', selectedModalType);
        return `/accounting/accounts/?${params.toString()}`;
    }, [selectedModalType]);

    const parentAccountsQuery = useCustomQuery(parentAccountsUrl || '/accounting/accounts/', ['accounting-parent-options', selectedModalType], {
        enabled: Boolean(parentAccountsUrl && isModalOpen),
        select: (response) => {
            const source = Array.isArray(response)
                ? response
                : Array.isArray(response?.results)
                    ? response.results
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

            return source
                .filter((account) => Boolean(account?.is_group ?? account?.isGroup))
                .map((account) => ({
                    id: account?.id || account?.uuid || '',
                    code: String(account?.code || ''),
                    name: account?.name || '',
                }))
                .filter((account) => account.id)
                .sort((a, b) => a.code.localeCompare(b.code));
        },
    });

    const parentOptions = useMemo(() => parentAccountsQuery.data ?? [], [parentAccountsQuery.data]);

    const filteredAccountIds = useMemo(() => {
        const matches = new Set();
        const parentsToInclude = new Set();

        allAccounts.forEach((account) => {
            const matchesSearch =
                !searchTerm ||
                account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.code.toLowerCase().includes(searchTerm.toLowerCase());

            if (matchesSearch) {
                matches.add(account.id);
                collectParentIds(account.id, accountById).forEach((parentId) =>
                    parentsToInclude.add(parentId)
                );
            }
        });

        return new Set([...matches, ...parentsToInclude]);
    }, [accountById, allAccounts, searchTerm]);

    const allGroupIds = useMemo(
        () =>
            allAccounts
                .filter((account) => account.isGroup || (Array.isArray(account.children) && account.children.length > 0))
                .map((account) => account.id),
        [allAccounts]
    );

    const t = useMemo(
        () =>
            language === 'ar'
                ? {
                    title: 'شجرة الحسابات',
                    subtitle: 'هيكلة وتنظيم الحسابات المالية بدقة.',
                    newAccount: 'حساب جديد',
                    searchPlaceholder: 'بحث بالاسم أو الكود...',
                    export: 'تصدير',
                    expandAll: 'توسيع الكل',
                    collapseAll: 'طي الكل',
                    colCode: 'الكود',
                    colName: 'اسم الحساب',
                    colType: 'النوع',
                    modalAdd: 'إضافة حساب جديد',
                    discard: 'إلغاء',
                    save: 'حفظ الحساب',
                    allTypes: 'كل الأنواع',
                    allSources: 'كل المصادر',
                    systemOnly: 'حسابات النظام',
                    customOnly: 'حسابات مخصصة',
                    reset: 'إعادة ضبط',
                }
                : {
                    title: 'Chart of Accounts',
                    subtitle: 'Architect your financial hierarchy with precision.',
                    newAccount: 'New Account',
                    searchPlaceholder: 'Search by name or code...',
                    export: 'Export',
                    expandAll: 'Expand All',
                    collapseAll: 'Collapse All',
                    colCode: 'Code',
                    colName: 'Account Name',
                    colType: 'Type',
                    modalAdd: 'Create New Account',
                    discard: 'Discard',
                    save: 'Save Account',
                    allTypes: 'All Types',
                    allSources: 'All Sources',
                    systemOnly: 'System Accounts',
                    customOnly: 'Custom Accounts',
                    reset: 'Reset',
                },
        [language]
    );

    useEffect(() => {
        if (treeQuery.error) {
            toast.error(language === 'ar' ? 'فشل تحميل شجرة الحسابات' : 'Failed to load chart of accounts tree.');
        }
    }, [language, treeQuery.error]);

    useEffect(() => {
        if (accountTypesQuery.error) {
            toast.error(language === 'ar' ? 'فشل تحميل أنواع الحسابات' : 'Failed to load account types.');
        }
    }, [accountTypesQuery.error, language]);

    useEffect(() => {
        if (parentAccountsQuery.error && isModalOpen) {
            toast.error(language === 'ar' ? 'فشل تحميل الحسابات الأب' : 'Failed to load parent accounts.');
        }
    }, [isModalOpen, language, parentAccountsQuery.error]);

    const toggleExpand = (id) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleCreateAccount = async (payload) => {
        try {
            await createAccountMutation.mutateAsync(payload);
            toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully.');
            setIsModalOpen(false);
        } catch (error) {
            const fallback = language === 'ar' ? 'فشل إنشاء الحساب' : 'Failed to create account.';
            toast.error(error?.response?.data?.message || fallback);
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterType('All');
        setFilterSource('All');
        setExpandedNodes(new Set());
    };

    return (
        <section data-module="chart-of-accounts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <ChartOfAccountsHeader t={t} onOpenModal={() => setIsModalOpen(true)} />

                <ChartOfAccountsFilters
                    t={t}
                    language={language}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    filterSource={filterSource}
                    setFilterSource={setFilterSource}
                    accountTypes={accountTypes}
                    accountsForExport={allAccounts}
                    onExpandAll={() => setExpandedNodes(new Set(allGroupIds))}
                    onCollapseAll={() => setExpandedNodes(new Set())}
                    onResetFilters={resetFilters}
                />

                <ChartOfAccountsTable
                    t={t}
                    language={language}
                    nodes={treeNodes}
                    searchTerm={searchTerm}
                    expandedNodes={expandedNodes}
                    onToggleExpand={toggleExpand}
                    filteredAccountIds={filteredAccountIds}
                    isLoading={treeQuery.isLoading}
                    onResetFilters={resetFilters}
                />

                <NewAccountModal
                    open={isModalOpen}
                    t={t}
                    language={language}
                    accountTypes={accountTypes}
                    parentOptions={parentOptions}
                    onAccountTypeChange={setSelectedModalType}
                    defaultTypeId={filterType !== 'All' ? filterType : accountTypes[0]?.id}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCreateAccount}
                    isSubmitting={createAccountMutation.isPending}
                    isParentLoading={parentAccountsQuery.isFetching}
                />
            </div>
        </section>
    );
};

export default ChartOfAccounts;
