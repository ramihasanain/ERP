import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Trash2 } from 'lucide-react';

const TaxSlabsTable = () => {
    const { t } = useTranslation(['hr', 'common']);
    return (
    <Card className="padding-none overflow-x-auto" style={{ overflowX: 'auto', minWidth: 0, width: '100%' }}>
        <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: 'var(--color-slate-50)', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '1rem' }}>Min Income (JOD)</th>
                    <th style={{ padding: '1rem' }}>Max Income (JOD)</th>
                    <th style={{ padding: '1rem' }}>Tax Rate (%)</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {slabs.map((slab) => (
                    <tr key={slab.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                            <Input type="number" value={slab.min} onChange={(event) => onChangeSlab(slab.id, 'min', event.target.value)} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                            <Input type="number" value={slab.max} onChange={(event) => onChangeSlab(slab.id, 'max', event.target.value)} />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Input
                                    type="number"
                                    value={slab.rate}
                                    onChange={(event) => onChangeSlab(slab.id, 'rate', event.target.value)}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--color-text-muted)',
                                    }}
                                >
                                    %
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <Button
                                variant="ghost"
                                icon={<Trash2 size={18} />}
                                onClick={() => onDeleteSlab(slab.id)}
                                className="cursor-pointer"
                                disabled={isSaving}
                                style={{ color: 'var(--color-error-600)' }}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Card>
    );
};

export default TaxSlabsTable;
