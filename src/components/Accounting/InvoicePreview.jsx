import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Spinner from '@/core/Spinner';
import useCustomQuery from '@/hooks/useQuery';
import { ArrowLeft, Printer, Download, Mail } from 'lucide-react';

const InvoicePreview = () => {
    const navigate = useNavigate();
    const { id } = useParams();

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
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    };

    const getStatusStyle = (status) => {
        const value = String(status || '').toLowerCase();
        if (value === 'paid') {
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
                name: data.customer_name || 'Customer',
                address: data.billing_address || '-',
                email: '-',
            },
            company: {
                name: 'UnifiedCore Systems',
                address: '123 Innovation Drive, Tech City, TC 90210',
                email: 'finance@unifiedcore.com',
                phone: '+1 (555) 000-1234',
            },
            items: (data.lines || []).map((line) => ({
                id: line.id,
                description: line.description || 'Item',
                qty: Number(line.quantity ?? 0),
                price: Number(line.unit_price ?? 0),
                total: Number(line.line_gross ?? line.line_net ?? 0),
            })),
            subtotal,
            taxRate,
            taxAmount,
            total,
        };
    }, [invoiceQuery.data]);

    const dueInText = useMemo(() => {
        if (!invoice?.dueDateRaw) return 'Due date not set';
        const due = new Date(invoice.dueDateRaw);
        if (Number.isNaN(due.getTime())) return 'Due date not set';
        const today = new Date();
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        if (diffDays === 0) return 'Due today';
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`;
    }, [invoice?.dueDateRaw]);

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

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate('/admin/accounting')}
                    className="cursor-pointer shrink-0"
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="outline" icon={<Printer size={16} />}>Print</Button>
                    <Button variant="outline" icon={<Download size={16} />}>Download</Button>
                    <Button icon={<Mail size={16} />}>Send Invoice</Button>
                </div>
            </div>

            <Card className="padding-none" style={{ overflow: 'hidden' }}>
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
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                                {invoice.company.address}<br />
                                {invoice.company.email}<br />
                                {invoice.company.phone}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-slate-200)', letterSpacing: '-0.02em', margin: 0 }}>INVOICE</h2>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '0.5rem' }}>#{invoice.id}</div>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ display: 'inline-block', width: '80px' }}>Date:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{invoice.date}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ display: 'inline-block', width: '80px' }}>Due Date:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{invoice.dueDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '3rem', padding: '1.5rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Bill To</h3>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{invoice.client.name}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            {invoice.client.address}<br />
                            {invoice.client.email}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Description</th>
                                    <th style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '100px' }}>Qty</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '150px' }}>Price</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '150px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1.25rem 0', fontWeight: 500, color: 'var(--color-text-main)' }}>{item.description}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{item.qty}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{invoice.currency} {item.price.toFixed(2)}</td>
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
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Thank you for your business!</p>
                        <p>Please make checks payable to <strong>{invoice.company.name}</strong>. Payment is due based on the due date above.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InvoicePreview;
