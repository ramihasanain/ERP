import React from 'react';
import Card from '@/components/Shared/Card';
import SkeletonBlock from './SkeletonBlock';

const EmployeeDashboardSkeleton = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <SkeletonBlock height={26} width={260} radius={10} />
                    <SkeletonBlock height={14} width={340} radius={10} />
                </div>
                <SkeletonBlock height={40} width={140} radius={12} />
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <SkeletonBlock height={18} width={200} />
                    <SkeletonBlock height={32} width={120} radius={999} />
                </div>
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1.5fr 160px', gap: '0.75rem' }}>
                    <SkeletonBlock height={38} />
                    <SkeletonBlock height={38} />
                    <SkeletonBlock height={38} />
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <SkeletonBlock height={12} width="70%" />
                    <SkeletonBlock height={12} width="55%" />
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {[0, 1, 2].map((i) => (
                    <Card key={i} className="padding-lg">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <SkeletonBlock height={40} width={40} radius={12} />
                            <SkeletonBlock height={18} width={180} />
                        </div>
                        <SkeletonBlock height={14} width="80%" />
                        <div style={{ marginTop: '0.75rem' }}>
                            <SkeletonBlock height={8} width="100%" radius={999} />
                        </div>
                    </Card>
                ))}
            </div>

            <div>
                <SkeletonBlock height={20} width={180} />
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {[0, 1, 2, 3].map((i) => (
                        <Card key={i} className="padding-md">
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <SkeletonBlock height={40} width={40} radius={12} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <SkeletonBlock height={14} width="70%" />
                                    <SkeletonBlock height={12} width="45%" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboardSkeleton;

