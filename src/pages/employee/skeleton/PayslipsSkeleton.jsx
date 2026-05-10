import React from 'react';
import Card from '@/components/Shared/Card';
import SkeletonBlock from './SkeletonBlock';

const PayslipsSkeleton = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <SkeletonBlock height={26} width={180} />
                <div style={{ marginTop: '0.65rem' }}>
                    <SkeletonBlock height={14} width={360} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="padding-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <SkeletonBlock height={48} width={48} radius={12} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <SkeletonBlock height={16} width={160} />
                                    <SkeletonBlock height={12} width={140} />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <SkeletonBlock height={12} width={80} />
                                <SkeletonBlock height={18} width={110} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <SkeletonBlock height={34} width={88} radius={10} />
                            <SkeletonBlock height={34} width="100%" radius={10} />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PayslipsSkeleton;

