import React, { useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { ArrowLeft, Printer, Download, Mail } from 'lucide-react';

const InvoicePreview = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const printableRef = useRef(null);
    const tenantCompanyName = useMemo(() => {
        try {
            const authUserRaw = localStorage.getItem('auth_user');
            if (!authUserRaw) return 'Company';
            const authUser = JSON.parse(authUserRaw);
            return authUser?.user?.company_name || 'Company';
        } catch {
            return 'Company';
        }
    }, []);

    const invoiceQuery = useCustomQuery(
        `/api/sales/invoices/${id}/`,
        ['sales-invoice-preview', id],
        {
            enabled: Boolean(id),
        }
    );

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    };

    const getStatusStyle = (status) => {
        const value = String(status || '').toLowerCase();
        if (value === 'paid') {
            return { bg: 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))', color: 'var(--color-success)' };
        }
        if (value === 'posted') {
            return { bg: 'color-mix(in srgb, var(--color-success) 18%, var(--color-bg-card))', color: 'var(--color-success)' };
        }
        if (value === 'partial') {
            return { bg: 'color-mix(in srgb, var(--color-warning) 18%, var(--color-bg-card))', color: 'var(--color-warning)' };
        }
        if (value === 'overdue') {
            return { bg: 'color-mix(in srgb, var(--color-error) 18%, var(--color-bg-card))', color: 'var(--color-error)' };
        }
        return { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)' };
    };

    const invoice = useMemo(() => {
        const data = invoiceQuery.data;
        if (!data) return null;

        const subtotal = Number(data.subtotal_net ?? 0);
        const taxAmount = Number(data.total_tax ?? 0);
        const total = Number(data.grand_total ?? 0);
        const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;

        return {
            id: data.number || data.id,
            date: formatDate(data.invoice_date),
            dueDate: formatDate(data.due_date),
            dueDateRaw: data.due_date,
            status: data.status ? String(data.status).charAt(0).toUpperCase() + String(data.status).slice(1) : 'Draft',
            currency: data.currency || 'USD',
            client: {
                name: data.customer_name || 'Tech Solutions Ltd.',
                address: data.billing_address || '123 Innovation Drive, Tech City, TC 90210',
                email: data.customer_email || data.customer?.email || 'finance@unifiedcore.com',
                phone: data.customer_phone || data.customer?.phone || '+1 (555) 000-1234',
            },
            amountsIncludeTax: Boolean(data.amounts_include_tax),
            notes: data.notes || '',
            receiptAccount: data.receipt_account_display?.name || '-',
            warehouse: data.warehouse_display?.name || '-',
            createdBy: data.created_by ?? '-',
            createdAt: formatDate(data.created_at),
            updatedAt: formatDate(data.updated_at),
            company: {
                name: tenantCompanyName,
            },
            items: (data.lines || []).map((line, index) => ({
                id: line.id ?? `${line.order ?? index}-${line.description ?? 'item'}`,
                description: line.description || 'Item',
                qty: Number(line.quantity ?? 0),
                price: Number(line.unit_price ?? 0),
                taxRule: line.tax_rule?.name || '-',
                lineNet: Number(line.line_net ?? 0),
                lineTax: Number(line.line_tax ?? 0),
                total: Number(line.line_gross ?? line.line_net ?? 0),
                order: line.order ?? 0,
            })),
            payments: (data.payments || []).map((payment) => ({
                amount: Number(payment.amount ?? 0),
                paymentDate: formatDate(payment.payment_date),
                bankAccount: payment.bank_account_display?.name || '-',
                glCode: payment.bank_account_display?.gl_account?.code || '-',
                method: payment.payment_method || '-',
                reference: payment.reference || '-',
                notes: payment.notes || '-',
                createdAt: formatDate(payment.created_at),
            })),
            subtotal,
            taxRate,
            taxAmount,
            total,
            remainingBalance: Number(data.remaining_balance ?? 0),
        };
    }, [invoiceQuery.data, tenantCompanyName]);

    const dueDateRaw = invoice?.dueDateRaw;

    const dueInText = useMemo(() => {
        if (!dueDateRaw) return 'Due date not set';
        const due = new Date(dueDateRaw);
        if (Number.isNaN(due.getTime())) return 'Due date not set';
        const today = new Date();
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        if (diffDays === 0) return 'Due today';
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`;
    }, [dueDateRaw]);

    if (invoiceQuery.isLoading) {
        return (
            <div style={{ minHeight: '320px', display: 'grid', placeItems: 'center' }}>
                <Spinner />
            </div>
        );
    }

    if (invoiceQuery.isError || !invoice) {
        return (
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate('/admin/accounting/invoices')}
                    className="cursor-pointer shrink-0"
                    style={{ width: 'fit-content' }}
                />
                <Card>
                    <p style={{ color: 'var(--color-error)', margin: 0 }}>Failed to load invoice preview.</p>
                </Card>
            </div>
        );
    }

    const statusStyle = getStatusStyle(invoice.status);
    const handlePrint = () => {
        window.print();
    };
    const handleDownload = () => {
        window.print();
    };

    return (
        <div ref={printableRef} className="invoice-printable-area" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Button
                        variant="ghost"
                        icon={<ArrowLeft size={18} />}
                        onClick={() => navigate('/admin/accounting/invoices')}
                        className="cursor-pointer shrink-0"
                    />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {invoice.id}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="outline" icon={<Printer size={16} />} onClick={handlePrint}>Print</Button>
                    <Button variant="outline" icon={<Download size={16} />} onClick={handleDownload}>Download</Button>
                    <Button icon={<Mail size={16} />}>Send Invoice</Button>
                </div>
            </div>

            <Card className="padding-none invoice-print-content" style={{ overflow: 'hidden' }}>
                <div style={{ background: 'var(--color-bg-subtle)', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Status:</span>
                        <span style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            {invoice.status}
                        </span>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {dueInText}
                    </div>
                </div>

                <div style={{ padding: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                        <div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.5rem',
                                marginBottom: '1rem'
                            }}>
                                U
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{invoice.company.name}</h1>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'color-mix(in srgb, var(--color-primary-600) 28%, var(--color-bg-card))', letterSpacing: '-0.02em', margin: 0 }}>INVOICE</h2>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '0.5rem' }}>#{invoice.id}</div>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ display: 'inline-block', width: '80px' }}>Date:</span>
                                    <span dir="ltr" style={{ fontWeight: 600, color: 'var(--color-text-main)', unicodeBidi: 'embed' }}>{invoice.date}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ display: 'inline-block', width: '80px' }}>Due Date:</span>
                                    <span dir="ltr" style={{ fontWeight: 600, color: 'var(--color-text-main)', unicodeBidi: 'embed' }}>{invoice.dueDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '3rem', padding: '1.5rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Bill To</h3>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{invoice.client.name}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            {invoice.client.address}<br />
                            {invoice.client.email}<br />
                            {invoice.client.phone}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '1rem' }}>Invoice Metadata</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem 1.25rem' }}>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Warehouse:</strong> {invoice.warehouse}</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Receipt Account:</strong> {invoice.receiptAccount}</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Amounts Include Tax:</strong> {invoice.amountsIncludeTax ? 'Yes' : 'No'}</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Created By:</strong> {invoice.createdBy}</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Created At:</strong> <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{invoice.createdAt}</span></div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Updated At:</strong> <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{invoice.updatedAt}</span></div>
                        </div>
                        <div style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            <strong style={{ color: 'var(--color-text-main)' }}>Notes:</strong> {invoice.notes || '-'}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Description</th>
                                    <th style={{ textAlign: 'left', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Tax Rule</th>
                                    <th style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '100px' }}>Qty</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '130px' }}>Price</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '130px' }}>Net</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '130px' }}>Tax</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '130px' }}>Gross</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1.25rem 0', color: 'var(--color-text-main)' }}>
                                            <div style={{ fontWeight: 600 }}>{item.description}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                                                Order: {item.order}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 0', color: 'var(--color-text-secondary)' }}>{item.taxRule}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{item.qty}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{invoice.currency} {item.price.toFixed(2)}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{invoice.currency} {item.lineNet.toFixed(2)}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{invoice.currency} {item.lineTax.toFixed(2)}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-main)' }}>{invoice.currency} {item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                <span>Subtotal</span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{invoice.currency} {invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                                <span>Tax ({invoice.taxRate.toFixed(2)}%)</span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{invoice.currency} {invoice.taxAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Total Due</span>
                                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary-600)' }}>{invoice.currency} {invoice.total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                <span>Remaining Balance</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{invoice.currency} {invoice.remainingBalance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '1rem' }}>Payments</h3>
                        {invoice.payments.length === 0 ? (
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No payments recorded.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.85rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                                        <th style={{ textAlign: 'right', padding: '0.85rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Amount</th>
                                        <th style={{ textAlign: 'left', padding: '0.85rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Method</th>
                                        <th style={{ textAlign: 'left', padding: '0.85rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Bank Account</th>
                                        <th style={{ textAlign: 'left', padding: '0.85rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Ref</th>
                                        <th style={{ textAlign: 'left', padding: '0.85rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.payments.map((payment, index) => (
                                        <tr key={`${payment.paymentDate}-${payment.amount}-${index}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.9rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{payment.paymentDate}</span>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Created: <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{payment.createdAt}</span></div>
                                            </td>
                                            <td style={{ padding: '0.9rem 0', textAlign: 'right', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.9rem' }}>{invoice.currency} {payment.amount.toFixed(2)}</td>
                                            <td style={{ padding: '0.9rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{payment.method}</td>
                                            <td style={{ padding: '0.9rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                {payment.bankAccount}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GL: {payment.glCode}</div>
                                            </td>
                                            <td style={{ padding: '0.9rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{payment.reference}</td>
                                            <td style={{ padding: '0.9rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{payment.notes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Thank you for your business!</p>
                        <p>Please make checks payable to <strong>{invoice.company.name}</strong>. Payment is due based on the due date above.</p>
                    </div>
                </div>
            </Card>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 4mm;
                    }
                    .no-print {
                        display: none !important;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    .invoice-printable-area,
                    .invoice-printable-area * {
                        visibility: visible !important;
                    }
                    .invoice-printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        box-sizing: border-box !important;
                        font-size: 9px !important;
                        line-height: 1.05 !important;
                        gap: 0 !important;
                        transform: scale(0.92) !important;
                        transform-origin: top left !important;
                        width: 108.7% !important;
                    }
                    .invoice-print-content {
                        border: 0 !important;
                        box-shadow: none !important;
                    }
                    .invoice-printable-area,
                    .invoice-printable-area * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                    .invoice-printable-area h1 {
                        font-size: 0.9rem !important;
                        margin-bottom: 0.15rem !important;
                    }
                    .invoice-printable-area h2 {
                        font-size: 1.3rem !important;
                        margin: 0 !important;
                    }
                    .invoice-printable-area h3 {
                        margin-bottom: 0.15rem !important;
                    }
                    .invoice-printable-area p {
                        margin: 0 !important;
                    }
                    .invoice-printable-area table {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .invoice-printable-area tr,
                    .invoice-printable-area td,
                    .invoice-printable-area th {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        padding-top: 0.08rem !important;
                        padding-bottom: 0.08rem !important;
                    }
                    .invoice-printable-area [style*="padding: '3rem'"] {
                        padding: 0.4rem !important;
                    }
                    .invoice-printable-area [style*="marginBottom: '3rem'"],
                    .invoice-printable-area [style*="marginBottom: '2rem'"],
                    .invoice-printable-area [style*="marginTop: '2rem'"],
                    .invoice-printable-area [style*="marginTop: '4rem'"] {
                        margin-top: 0.2rem !important;
                        margin-bottom: 0.2rem !important;
                    }
                    .invoice-printable-area > .invoice-print-content > div:last-child {
                        margin-top: 0.2rem !important;
                        padding-top: 0.2rem !important;
                    }
                    .invoice-printable-area span,
                    .invoice-printable-area div {
                        line-height: 1.1 !important;
                    }
                }
            `,
            }} />
        </div>
    );
};

export default InvoicePreview;
