import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { post } from '@/api';
import { useCustomQuery } from '@/hooks/useQuery';
import { useCustomPost, useCustomPut, useCustomRemove } from '@/hooks/useMutation';
import ContractTemplatesEditorView from './ContractTemplatesEditorView';
import ContractTemplatesListView from './ContractTemplatesListView';
import ContractTemplatesPreviewView from './ContractTemplatesPreviewView';
import { formatTemplateDate, humanizeTag } from './utils';

const ContractTemplates = () => {
    const navigate = useNavigate();
    const { templateId } = useParams();
    const isNewPage = Boolean(useMatch('/admin/hr/contract-templates/new'));
    const isEditPage = Boolean(useMatch('/admin/hr/contract-templates/:templateId/edit'));
    const isPreviewPage = Boolean(useMatch('/admin/hr/contract-templates/:templateId/preview'));

    const [previewHtml, setPreviewHtml] = useState('');
    const [previewEmployee, setPreviewEmployee] = useState('');
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [isWidePreviewHeader, setIsWidePreviewHeader] = useState(typeof window !== 'undefined' ? window.innerWidth > 850 : true);
    const [isLargeEditorLayout, setIsLargeEditorLayout] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1200 : true);
    const [isNarrowEditorForm, setIsNarrowEditorForm] = useState(typeof window !== 'undefined' ? window.innerWidth < 1000 : false);
    const [isCompactEditorHeader, setIsCompactEditorHeader] = useState(typeof window !== 'undefined' ? window.innerWidth < 650 : false);
    const [formData, setFormData] = useState({ name: '', contract_type: 'full_time', body: '', is_default: false });
    const [isRenderingPreview, setIsRenderingPreview] = useState(false);

    const employeesQuery = useCustomQuery('/api/hr/employees/', ['hr-employees-contract-preview']);
    const templatesQuery = useCustomQuery('/api/hr/contract-templates/', ['hr-contract-templates']);
    const templateDetailsQuery = useCustomQuery(
        templateId ? `/api/hr/contract-templates/${templateId}/` : '/api/hr/contract-templates/',
        ['hr-contract-template', templateId],
        { enabled: Boolean(templateId) && (isEditPage || isPreviewPage) }
    );
    const tagsQuery = useCustomQuery('/api/hr/contract-templates/tags/', ['hr-contract-template-tags']);
    const createTemplateMutation = useCustomPost('/api/hr/contract-templates/', [['hr-contract-templates']]);
    const updateTemplateMutation = useCustomPut(
        templateId ? `/api/hr/contract-templates/${templateId}/` : '/api/hr/contract-templates/',
        [['hr-contract-templates'], ['hr-contract-template', templateId]]
    );
    const deleteTemplateMutation = useCustomRemove(
        (targetTemplateId) => `/api/hr/contract-templates/${targetTemplateId}/`,
        [['hr-contract-templates']]
    );

    const activeEmployees = useMemo(
        () => (employeesQuery.data?.data || []).filter((employee) => employee.status === 'active'),
        [employeesQuery.data]
    );
    const templatesFromApi = useMemo(() => {
        const rows = templatesQuery.data?.data;
        if (!Array.isArray(rows)) return [];
        return rows.map((template) => ({
            id: template.id,
            name: template.name,
            contractType: template.contract_type || 'full_time',
            type: template.contract_type_display || template.contract_type || '—',
            content: template.body || '',
            isDefault: Boolean(template.is_default),
            lastModified: formatTemplateDate(template.updated_at),
        }));
    }, [templatesQuery.data]);
    const availableVariables = useMemo(() => {
        const tagsPayload = tagsQuery.data;
        const tags = tagsPayload?.tags || tagsPayload?.data?.tags || [];
        if (!Array.isArray(tags)) return [];
        return tags.map((tag) => ({ key: tag, label: humanizeTag(tag) }));
    }, [tagsQuery.data]);

    useEffect(() => {
        if (!activeEmployees.length) return;
        const selectedEmployeeExists = activeEmployees.some((employee) => employee.id === previewEmployee);
        if (!selectedEmployeeExists) {
            setPreviewEmployee(activeEmployees[0].id);
        }
    }, [activeEmployees, previewEmployee]);

    useEffect(() => {
        const handleResize = () => {
            setIsWidePreviewHeader(window.innerWidth > 850);
            setIsLargeEditorLayout(window.innerWidth >= 1200);
            setIsNarrowEditorForm(window.innerWidth < 1000);
            setIsCompactEditorHeader(window.innerWidth < 650);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isNewPage) return;
        setFormData({ name: '', contract_type: 'full_time', body: '', is_default: false });
    }, [isNewPage]);

    useEffect(() => {
        if (!isEditPage) return;
        const details = templateDetailsQuery.data;
        if (!details) return;
        setFormData({
            name: details.name || '',
            contract_type: details.contract_type || 'full_time',
            body: details.body || '',
            is_default: Boolean(details.is_default),
        });
    }, [isEditPage, templateDetailsQuery.data]);

    const handleSave = async () => {
        if (!formData.name || !formData.body) {
            toast.error('Please fill in template name and body.');
            return;
        }
        if (isEditPage && templateId) {
            try {
                await updateTemplateMutation.mutateAsync({
                    name: formData.name,
                    contract_type: formData.contract_type,
                    is_default: Boolean(formData.is_default),
                    body: formData.body,
                });
                toast.success('Template updated successfully.');
                navigate('/admin/hr/contract-templates');
            } catch (error) {
                const message =
                    error?.response?.data?.detail ||
                    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                    error?.message ||
                    'Could not update contract template.';
                toast.error(typeof message === 'string' ? message : 'Could not update contract template.');
            }
            return;
        }
        try {
            await createTemplateMutation.mutateAsync({
                name: formData.name,
                contract_type: formData.contract_type,
                is_default: Boolean(formData.is_default),
                body: formData.body,
            });
            toast.success('Template created successfully.');
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not create contract template.';
            toast.error(typeof message === 'string' ? message : 'Could not create contract template.');
            return;
        }
        navigate('/admin/hr/contract-templates');
    };

    const handlePreviewRender = useCallback(async (selectedTemplateId) => {
        if (!previewEmployee) {
            toast.error('Please select an employee for preview.');
            return;
        }
        setPreviewHtml('');
        setIsRenderingPreview(true);
        try {
            const response = await post(`/api/hr/contract-templates/${selectedTemplateId}/render/?output=html`, {
                employee_id: previewEmployee,
            });
            const html =
                typeof response === 'string'
                    ? response
                    : typeof response?.data === 'string'
                        ? response.data
                        : typeof response?.html === 'string'
                            ? response.html
                            : '';
            if (!html) {
                toast.error('Template render returned empty HTML.');
                return;
            }
            setPreviewHtml(html);
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not render contract template.';
            toast.error(typeof message === 'string' ? message : 'Could not render contract template.');
        } finally {
            setIsRenderingPreview(false);
        }
    }, [previewEmployee]);

    useEffect(() => {
        if (!isPreviewPage || !templateId || !previewEmployee) return;
        handlePreviewRender(templateId);
    }, [isPreviewPage, templateId, previewEmployee, handlePreviewRender]);

    const handlePrint = () => {
        if (!previewHtml) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title></title>
                <style>
                    @page { size: auto; margin: 0; }
                    html, body { margin: 0; padding: 0; }
                    body {
                        font-family: 'Times New Roman', serif;
                        line-height: 1.8;
                        font-size: 14px;
                        color: #000;
                        background: #fff;
                    }
                    .print-root {
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="print-root">${previewHtml}</div>
            </body>
            </html>
        `);
        printWindow.document.title = '';
        printWindow.document.close();
        printWindow.print();
    };

    const getCopyContent = () => {
        if (!previewHtml) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(previewHtml, 'text/html');
        const bodyChildren = Array.from(doc.body.children);
        if (bodyChildren.length === 1 && bodyChildren[0].tagName.toLowerCase() === 'div') {
            return bodyChildren[0].innerHTML;
        }
        return doc.body.innerHTML || previewHtml;
    };

    const handleCopy = async () => {
        const contentToCopy = getCopyContent();
        if (!contentToCopy) return;
        await navigator.clipboard.writeText(contentToCopy);
        toast.success('Copied to clipboard.');
    };

    const handleDeleteTemplate = async () => {
        if (!templateToDelete?.id) return;
        try {
            await deleteTemplateMutation.mutateAsync(templateToDelete.id);
            toast.success('Template deleted successfully.');
            setTemplateToDelete(null);
        } catch (error) {
            const message =
                error?.response?.data?.detail ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Could not delete contract template.';
            toast.error(typeof message === 'string' ? message : 'Could not delete contract template.');
        }
    };

    const insertVariable = (key) => {
        const textarea = document.getElementById('template-editor');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = formData.body;
            const newText = text.substring(0, start) + `{{${key}}}` + text.substring(end);
            setFormData({ ...formData, body: newText });
        }
    };

    if (isPreviewPage) {
        const previewTemplateName = templateDetailsQuery.data?.name || 'Contract Preview';
        return (
            <ContractTemplatesPreviewView
                templateDetailsQuery={templateDetailsQuery}
                previewTemplateName={previewTemplateName}
                isWidePreviewHeader={isWidePreviewHeader}
                navigate={navigate}
                previewHtml={previewHtml}
                onCopy={handleCopy}
                onPrint={handlePrint}
                isRenderingPreview={isRenderingPreview}
            />
        );
    }

    if (isNewPage || isEditPage) {
        return (
            <ContractTemplatesEditorView
                isEditPage={isEditPage}
                templateDetailsQuery={templateDetailsQuery}
                navigate={navigate}
                isCompactEditorHeader={isCompactEditorHeader}
                createTemplateMutation={createTemplateMutation}
                updateTemplateMutation={updateTemplateMutation}
                onSave={handleSave}
                isLargeEditorLayout={isLargeEditorLayout}
                isNarrowEditorForm={isNarrowEditorForm}
                formData={formData}
                setFormData={setFormData}
                tagsQuery={tagsQuery}
                availableVariables={availableVariables}
                onInsertVariable={insertVariable}
            />
        );
    }

    return (
        <ContractTemplatesListView
            navigate={navigate}
            previewEmployee={previewEmployee}
            onPreviewEmployeeChange={setPreviewEmployee}
            employeesQuery={employeesQuery}
            activeEmployees={activeEmployees}
            templatesQuery={templatesQuery}
            templatesFromApi={templatesFromApi}
            templateToDelete={templateToDelete}
            onDeleteClick={setTemplateToDelete}
            onCloseDeleteModal={() => setTemplateToDelete(null)}
            onConfirmDelete={handleDeleteTemplate}
            isDeletingTemplate={deleteTemplateMutation.isPending}
        />
    );
};

export default ContractTemplates;
