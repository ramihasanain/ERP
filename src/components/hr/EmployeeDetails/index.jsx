import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, Copy, CreditCard, FileText, Save, User, X } from 'lucide-react';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import Spinner from '@/core/Spinner';
import SearchableSelectBackend from '@/core/SearchableSelectBackend';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost, useCustomPut } from '@/hooks/useMutation';
import ContractSalaryTab from '@/components/hr/ContractSalaryTab';
import TerminationModal from '@/components/hr/TerminationModal';
import { useAuth } from '@/context/AuthContext';
import { useCompanyName } from '@/hooks/useCompanyName';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

const defaultValues = {
    user: '',
    email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nationality: '',
    phone_number: '',
    address: '',
    department: '',
    position: '',
    joining_date: '',
    status: 'active',
    bank_name: '',
    account_number: '',
    iban: '',
};

const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const normalizeDepartments = (response) =>
    normalizeArrayResponse(response).map((item) => ({
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
    }));

const normalizePositions = (response) =>
    normalizeArrayResponse(response).map((item) => ({
        id: item?.id || item?.uuid || '',
        name: item?.name || '',
    }));

const normalizeEmployeeFormData = (response) => {
    const rawData = response?.data && typeof response.data === 'object' && !Array.isArray(response.data) ? response.data : response;
    const userData = rawData?.user_data || rawData || {};
    const profileData = rawData?.profile_data || rawData || {};

    return {
        id: rawData?.id || rawData?.uuid || '',
        user: rawData?.user ?? userData?.user ?? '',
        email: userData?.email || '',
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        date_of_birth: profileData?.date_of_birth || '',
        nationality: profileData?.nationality || '',
        phone_number: profileData?.phone_number || '',
        address: profileData?.address || '',
        department: profileData?.department || '',
        position: profileData?.position || '',
        joining_date: profileData?.joining_date || '',
        status: (profileData?.status || 'active').toLowerCase(),
        bank_name: profileData?.bank_name || '',
        account_number: profileData?.account_number || '',
        iban: profileData?.iban || '',
    };
};

const normalizeLeaves = (response) => normalizeArrayResponse(response);

const normalizeDocuments = (response) => normalizeArrayResponse(response);

const copyText = async (value) => {
    if (!value) return false;
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textArea);
        return copied;
    }
};

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isEmployee } = useAuth();
    const isNew = !id;
    const [activeTab, setActiveTab] = useState('overview');
    const [isTerminationOpen, setIsTerminationOpen] = useState(false);
    const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
    const [positionSearchTerm, setPositionSearchTerm] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const [copiedField, setCopiedField] = useState('');
    const companyName = useCompanyName();
    const loginUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const slug = companyName ? encodeURIComponent(companyName) : '';
        return `${window.location.origin}/auth/signup/${slug}`;
    }, [companyName]);
    const isAuthUserEmployee = user?.auth_user?.role === 'employee' || isEmployee;
    const isProfileApiTab = activeTab === 'overview' || activeTab === 'banking';
    const isLeavesTab = isAuthUserEmployee && activeTab === 'leaves';
    const isDocumentsTab = isAuthUserEmployee && activeTab === 'documents';

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isDirty },
    } = useForm({
        defaultValues,
    });
    const {
        register: registerLeave,
        handleSubmit: handleLeaveSubmit,
        reset: resetLeaveForm,
        formState: { isSubmitting: isLeaveFormSubmitting },
    } = useForm({
        defaultValues: {
            leave_type: '',
            start_date: '',
            end_date: '',
            reason: '',
        },
    });
    const {
        register: registerDocument,
        handleSubmit: handleDocumentSubmit,
        reset: resetDocumentForm,
        formState: { isSubmitting: isDocumentFormSubmitting },
    } = useForm({
        defaultValues: {
            title: '',
            description: '',
            file: null,
        },
    });

    const sessionCacheQueryOpts = { staleTime: Infinity, gcTime: 1000 * 60 * 60 * 24 };

    const employeeQuery = useCustomQuery(`/api/hr/employees/${id || ''}/`, ['hr-employee', id], {
        enabled: !!id,
        select: normalizeEmployeeFormData,
        ...sessionCacheQueryOpts,
    });

    const departmentsQuery = useCustomQuery('/api/hr/departments/', ['hr-departments'], {
        enabled: !isNew || isProfileApiTab,
        select: normalizeDepartments,
        ...sessionCacheQueryOpts,
    });
    const positionsQuery = useCustomQuery('/api/hr/positions/', ['hr-positions'], {
        enabled: !isNew || isProfileApiTab,
        select: normalizePositions,
        ...sessionCacheQueryOpts,
    });
    const leavesQuery = useCustomQuery('/api/hr/employees/leaves/', ['hr-employee-leaves', id || 'new'], {
        enabled: isAuthUserEmployee && !!id,
        select: normalizeLeaves,
        ...sessionCacheQueryOpts,
    });
    const documentsQuery = useCustomQuery('/api/hr/employees/documents/', ['hr-employee-documents', id || 'new'], {
        enabled: isAuthUserEmployee && !!id,
        select: normalizeDocuments,
        ...sessionCacheQueryOpts,
    });

    const createEmployeeMutation = useCustomPost('/api/hr/employees/create/', [['hr-employees']]);
    const updateEmployeeMutation = useCustomPut(`/api/hr/employees/${id || 'new'}/`, [['hr-employees'], ['hr-employee', id]]);
    const createLeaveMutation = useCustomPost('/api/hr/employees/leaves/create/', [['hr-employee-leaves', id || 'new']]);
    const uploadDocumentMutation = useCustomPost('/api/hr/employees/documents/upload/', [['hr-employee-documents', id || 'new']]);

    useEffect(() => {
        if (!isNew && employeeQuery.data) {
            reset(employeeQuery.data);
        }
    }, [employeeQuery.data, isNew, reset]);

    useEffect(() => {
        if (isNew) {
            reset({
                ...defaultValues,
                joining_date: new Date().toISOString().split('T')[0],
            });
        }
    }, [isNew, reset]);

    useEffect(() => {
        if (!isAuthUserEmployee && (activeTab === 'leaves' || activeTab === 'documents')) {
            setActiveTab('overview');
        }
    }, [isAuthUserEmployee, activeTab]);

    useEffect(() => {
        if (!createdCredentials) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [createdCredentials]);

    const isLoading = isProfileApiTab && (departmentsQuery.isLoading || positionsQuery.isLoading || (!isNew && employeeQuery.isLoading));
    const hasError = isProfileApiTab && (departmentsQuery.isError || positionsQuery.isError || (!isNew && employeeQuery.isError));
    const isSubmitting = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

    const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
    const positions = useMemo(() => positionsQuery.data ?? [], [positionsQuery.data]);
    const filteredDepartments = useMemo(() => {
        const term = departmentSearchTerm.trim().toLowerCase();
        if (!term) return departments;
        return departments.filter((department) => (department?.name || '').toLowerCase().includes(term));
    }, [departments, departmentSearchTerm]);
    const filteredPositions = useMemo(() => {
        const term = positionSearchTerm.trim().toLowerCase();
        if (!term) return positions;
        return positions.filter((position) => (position?.name || '').toLowerCase().includes(term));
    }, [positions, positionSearchTerm]);
    const leaves = useMemo(() => leavesQuery.data ?? [], [leavesQuery.data]);
    const documents = useMemo(() => documentsQuery.data ?? [], [documentsQuery.data]);
    const watchedData = watch();

    const employeeName = `${watchedData.first_name || ''} ${watchedData.last_name || ''}`.trim();
    const employeeUserId =
        watchedData.user !== undefined && watchedData.user !== null && watchedData.user !== ''
            ? String(watchedData.user)
            : null;

    const onSubmit = async (values) => {
        const payload = {
            user_data: {
                email: values.email.trim(),
                first_name: values.first_name.trim(),
                last_name: values.last_name.trim(),
            },
            profile_data: {
                date_of_birth: values.date_of_birth || null,
                nationality: values.nationality.trim(),
                phone_number: values.phone_number.trim(),
                address: values.address.trim(),
                department: values.department || null,
                position: values.position || null,
                joining_date: values.joining_date || null,
                status: (values.status || 'active').toLowerCase(),
                bank_name: values.bank_name.trim(),
                account_number: values.account_number.trim(),
                iban: values.iban.trim(),
            },
        };

        try {
            if (isNew) {
                const result = await createEmployeeMutation.mutateAsync(payload);
                const newId = result?.id || result?.uuid || '';
                const createdEmail = result?.email || values.email.trim();
                const temporaryPassword = result?.temporary_password || '';
                toast.success('Employee created successfully.');
                setCreatedCredentials({
                    id: newId,
                    email: createdEmail,
                    temporaryPassword,
                });
                return;
            }

            await updateEmployeeMutation.mutateAsync(payload);
            toast.success('Employee updated successfully.');
        } catch (error) {
            const message = getApiErrorMessage(error, 'Employee request failed.');
            toast.error(message);
        }
    };

    const handleRefresh = async () => {
        if (!isProfileApiTab) return;
        await Promise.all([departmentsQuery.refetch(), positionsQuery.refetch(), !isNew ? employeeQuery.refetch() : Promise.resolve()]);
    };

    const handleLeaveRefresh = async () => {
        if (!isLeavesTab) return;
        await leavesQuery.refetch();
    };

    const handleDocumentsRefresh = async () => {
        if (!isDocumentsTab) return;
        await documentsQuery.refetch();
    };

    const handleCopyCredential = async (field) => {
        let value = '';
        let successLabel = '';
        if (field === 'email') {
            value = createdCredentials?.email || '';
            successLabel = 'Email';
        } else if (field === 'loginUrl') {
            value = loginUrl;
            successLabel = 'Login URL';
        } else {
            value = createdCredentials?.temporaryPassword || '';
            successLabel = 'Temporary password';
        }

        const copied = await copyText(value);
        if (!copied) {
            toast.error(`Could not copy ${successLabel.toLowerCase()}.`);
            return;
        }

        setCopiedField(field);
        toast.success(`${successLabel} copied.`);
        window.setTimeout(() => setCopiedField(''), 900);
    };

    const onSubmitLeave = async (values) => {
        try {
            await createLeaveMutation.mutateAsync({
                leave_type: values.leave_type.trim(),
                start_date: values.start_date,
                end_date: values.end_date,
                reason: values.reason.trim(),
            });
            toast.success('Leave request created successfully.');
            resetLeaveForm({
                leave_type: '',
                start_date: '',
                end_date: '',
                reason: '',
            });
        } catch (error) {
            const message = error?.response?.data?.detail || error?.message || 'Leave request failed.';
            toast.error(message);
        }
    };

    const onSubmitDocument = async (values) => {
        const file = values?.file?.[0];
        if (!file) {
            toast.error('Please choose a file before uploading.');
            return;
        }

        const payload = new FormData();
        payload.append('file', file);
        if (values.title?.trim()) payload.append('title', values.title.trim());
        if (values.description?.trim()) payload.append('description', values.description.trim());

        try {
            await uploadDocumentMutation.mutateAsync(payload);
            toast.success('Document uploaded successfully.');
            resetDocumentForm({
                title: '',
                description: '',
                file: null,
            });
        } catch (error) {
            const message = error?.response?.data?.detail || error?.message || 'Document upload failed.';
            toast.error(message);
        }
    };

    return (
        <>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/admin/hr/employees')} type="button" />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{isNew ? 'Add New Employee' : employeeName || 'Employee Profile'}</h1>
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                            {isNew ? 'Create a new employee profile' : `Employee ID: ${employeeUserId ?? '-'}`}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {!isNew && (
                        <Button type="button" variant="danger" onClick={() => setIsTerminationOpen(true)}>
                            End Service
                        </Button>
                    )}
                    <Button type="submit" icon={<Save size={16} />} isLoading={isSubmitting} disabled={!isNew && !isDirty}>
                        {isNew ? 'Create Employee' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '2rem' }}>
                <TabButton label="Overview" icon={<User size={18} />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton label="Contract & Salary" icon={<FileText size={18} />} active={activeTab === 'contract'} onClick={() => setActiveTab('contract')} />
                <TabButton label="Banking" icon={<CreditCard size={18} />} active={activeTab === 'banking'} onClick={() => setActiveTab('banking')} />
                {isAuthUserEmployee && (
                    <>
                        <TabButton label="Leaves" icon={<Calendar size={18} />} active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} />
                        <TabButton label="Documents" icon={<FileText size={18} />} active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
                    </>
                )}
            </div>

            {isLoading && <Spinner />}

            {hasError && (
                <Card className="padding-lg">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load employee data.</p>
                        <Button variant="outline" onClick={handleRefresh} type="button">
                            Retry
                        </Button>
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && activeTab === 'overview' && (
                <Card className="padding-lg">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Personal Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Controller
                            name="first_name"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => <Input label="First Name *" {...field} required />}
                        />
                        <Controller
                            name="last_name"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => <Input label="Last Name *" {...field} required />}
                        />
                        <Controller
                            name="email"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => <Input label="Email Address *" type="email" {...field} required />}
                        />
                        <Controller name="phone_number" control={control} render={({ field }) => <Input label="Phone Number" {...field} />} />
                        <Controller name="date_of_birth" control={control} render={({ field }) => <Input label="Date of Birth" type="date" {...field} />} />
                        <Controller name="nationality" control={control} render={({ field }) => <Input label="Nationality" {...field} />} />
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => <Input label="Address" style={{ gridColumn: 'span 2' }} {...field} />}
                        />
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Department</label>
                            <Controller
                                name="department"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelectBackend
                                        value={field.value || ''}
                                        onChange={(selectedValue) => field.onChange(selectedValue || '')}
                                        options={filteredDepartments}
                                        searchTerm={departmentSearchTerm}
                                        onSearchChange={setDepartmentSearchTerm}
                                        placeholder="Search departments..."
                                        emptyLabel="No departments found"
                                        getOptionLabel={(option) => option?.name || ''}
                                        getOptionValue={(option) => option?.id || ''}
                                        isInitialLoading={departmentsQuery.isLoading}
                                        zIndex={91}
                                    />
                                )}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Position</label>
                            <Controller
                                name="position"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelectBackend
                                        value={field.value || ''}
                                        onChange={(selectedValue) => field.onChange(selectedValue || '')}
                                        options={filteredPositions}
                                        searchTerm={positionSearchTerm}
                                        onSearchChange={setPositionSearchTerm}
                                        placeholder="Search positions..."
                                        emptyLabel="No positions found"
                                        getOptionLabel={(option) => option?.name || ''}
                                        getOptionValue={(option) => option?.id || ''}
                                        isInitialLoading={positionsQuery.isLoading}
                                        zIndex={90}
                                    />
                                )}
                            />
                        </div>

                        <Controller name="joining_date" control={control} render={({ field }) => <Input label="Joining Date" type="date" {...field} />} />

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                        }}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="terminated">Terminated</option>
                                    </select>
                                )}
                            />
                        </div>
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && activeTab === 'banking' && (
                <Card className="padding-lg">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Bank Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <Controller name="bank_name" control={control} render={({ field }) => <Input label="Bank Name" {...field} />} />
                        </div>
                        <Controller name="account_number" control={control} render={({ field }) => <Input label="Account Number" {...field} />} />
                        <Controller name="iban" control={control} render={({ field }) => <Input label="IBAN" {...field} />} />
                    </div>
                </Card>
            )}

            {!isLoading && !hasError && activeTab === 'contract' && <ContractSalaryTab employeeId={id} />}

            {!isLoading && !hasError && activeTab === 'leaves' && (
                <Card className="padding-lg">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Leaves</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {leavesQuery.isLoading ? (
                                <Spinner />
                            ) : leavesQuery.isError ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load leaves.</p>
                                    <Button variant="outline" type="button" onClick={handleLeaveRefresh}>
                                        Retry
                                    </Button>
                                </div>
                            ) : leaves.length === 0 ? (
                                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No leave requests found yet.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {leaves.map((leave) => (
                                        <div
                                            key={leave.id || leave.uuid || `${leave.start_date}-${leave.end_date}`}
                                            style={{
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '0.75rem',
                                                background: 'var(--color-bg-surface)',
                                            }}
                                        >
                                            <p style={{ margin: 0, fontWeight: 600 }}>{leave.leave_type || leave.type || 'Leave'}</p>
                                            <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-secondary)' }}>
                                                {leave.start_date || '-'} to {leave.end_date || '-'}
                                            </p>
                                            {(leave.reason || leave.notes) && (
                                                <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-secondary)' }}>{leave.reason || leave.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Leave Type" required {...registerLeave('leave_type', { required: true })} />
                                <div />
                                <Input label="Start Date" type="date" required {...registerLeave('start_date', { required: true })} />
                                <Input label="End Date" type="date" required {...registerLeave('end_date', { required: true })} />
                                <div style={{ gridColumn: 'span 2' }}>
                                    <Input label="Reason" {...registerLeave('reason')} />
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="button" onClick={handleLeaveSubmit(onSubmitLeave)} isLoading={createLeaveMutation.isPending || isLeaveFormSubmitting}>
                                        Add Leave Request
                                    </Button>
                                </div>
                            </div>
                        </div>
                </Card>
            )}

            {!isLoading && !hasError && activeTab === 'documents' && (
                <Card className="padding-lg">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>Documents</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {documentsQuery.isLoading ? (
                                <Spinner />
                            ) : documentsQuery.isError ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <p style={{ margin: 0, color: 'var(--color-error)' }}>Could not load documents.</p>
                                    <Button variant="outline" type="button" onClick={handleDocumentsRefresh}>
                                        Retry
                                    </Button>
                                </div>
                            ) : documents.length === 0 ? (
                                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No documents uploaded yet.</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {documents.map((document) => (
                                        <div
                                            key={document.id || document.uuid || document.file || document.title}
                                            style={{
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '0.75rem',
                                                background: 'var(--color-bg-surface)',
                                            }}
                                        >
                                            <p style={{ margin: 0, fontWeight: 600 }}>{document.title || document.name || 'Document'}</p>
                                            {document.description && (
                                                <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-secondary)' }}>{document.description}</p>
                                            )}
                                            {document.file_url && (
                                                <a
                                                    href={document.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ marginTop: '0.35rem', display: 'inline-block', color: 'var(--color-primary-600)' }}
                                                >
                                                    View File
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Title" {...registerDocument('title')} />
                                <Input label="Description" {...registerDocument('description')} />
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Upload File
                                    </label>
                                    <input
                                        type="file"
                                        {...registerDocument('file', { required: true })}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)',
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="button"
                                        onClick={handleDocumentSubmit(onSubmitDocument)}
                                        isLoading={uploadDocumentMutation.isPending || isDocumentFormSubmitting}
                                    >
                                        Upload Document
                                    </Button>
                                </div>
                            </div>
                        </div>
                </Card>
            )}
        </form>
        {!isNew && (
            <TerminationModal
                isOpen={isTerminationOpen}
                onClose={() => setIsTerminationOpen(false)}
                employeeId={id}
                employee={{
                    firstName: watchedData.first_name,
                    lastName: watchedData.last_name,
                    departmentId: watchedData.department,
                    joiningDate: watchedData.joining_date,
                }}
                onConfirm={(termination) => {
                    setIsTerminationOpen(false);
                    navigate('/admin/hr/final-settlement', {
                        state: {
                            termination,
                            employee: { id, ...watchedData },
                        },
                    });
                }}
            />
        )}
        {createdCredentials && (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    zIndex: 1001,
                }}
            >
                <div
                    style={{
                        width: 'min(520px, 100%)',
                        borderRadius: '14px',
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Account Created</h3>
                        <button
                            type="button"
                            onClick={() => {
                                const targetId = createdCredentials.id;
                                setCreatedCredentials(null);
                                setCopiedField('');
                                if (targetId) {
                                    navigate(`/admin/hr/employees/${targetId}`);
                                } else {
                                    navigate('/admin/hr/employees');
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-secondary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                            This employee account is created and must change the password on first login.
                        </p>

                        <CredentialRow
                            label="Email"
                            value={createdCredentials.email}
                            isCopied={copiedField === 'email'}
                            onCopy={() => handleCopyCredential('email')}
                        />
                        <CredentialRow
                            label="Temporary Password"
                            value={createdCredentials.temporaryPassword}
                            isCopied={copiedField === 'password'}
                            onCopy={() => handleCopyCredential('password')}
                        />
                        <CredentialRow
                            label="Login URL"
                            value={loginUrl}
                            isCopied={copiedField === 'loginUrl'}
                            onCopy={() => handleCopyCredential('loginUrl')}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <Button
                                type="button"
                                onClick={() => {
                                    const targetId = createdCredentials.id;
                                    setCreatedCredentials(null);
                                    setCopiedField('');
                                    if (targetId) {
                                        navigate(`/admin/hr/employees/${targetId}`);
                                    } else {
                                        navigate('/admin/hr/employees');
                                    }
                                }}
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

const CredentialRow = ({ label, value, onCopy, isCopied }) => (
    <div
        style={{
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '0.75rem',
            display: 'grid',
            gap: '0.4rem',
            background: 'var(--color-bg-primary)',
        }}
    >
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <code
                style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'var(--color-text-main)',
                    overflowWrap: 'anywhere',
                    flex: 1,
                }}
            >
                {value || '-'}
            </code>
            <button
                type="button"
                onClick={onCopy}
                style={{
                    border: '1px solid var(--color-border)',
                    background: isCopied ? 'var(--color-success)' : 'var(--color-bg-surface)',
                    color: isCopied ? '#fff' : 'var(--color-text-secondary)',
                    borderRadius: '8px',
                    width: '2rem',
                    height: '2rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transform: isCopied ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                }}
            >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
            </button>
        </div>
    </div>
);

const TabButton = ({ label, icon, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: active ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            color: active ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            fontWeight: active ? 600 : 500,
        }}
    >
        {icon}
        {label}
    </button>
);

export default EmployeeDetails;
