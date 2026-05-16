import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Clock, CheckCircle, LogIn, LogOut, Filter } from 'lucide-react';
import { useAttendance } from '@/context/AttendanceContext';

const Attendance = () => {
    const { t } = useTranslation(['hr', 'common']);

    const { attendanceLogs, clockIn, clockOut } = useAttendance();
    const today = new Date().toISOString().split('T')[0];

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Mock current user
    const currentEmployeeId = 'EMP-001';

    const filteredLogs = attendanceLogs
        .filter(l => l.employeeId === currentEmployeeId)
        .filter(log => {
            const logDate = new Date(log.date);
            const matchesFrom = !dateFrom || logDate >= new Date(dateFrom);
            const matchesTo = !dateTo || logDate <= new Date(dateTo);
            return matchesFrom && matchesTo;
        });

    const todayLog = attendanceLogs.find(log => log.date === today && log.employeeId === currentEmployeeId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('attendance.title')}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t('attendance.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem 1rem', background: 'var(--color-slate-100)', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                        {new Date().toDateString()}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Clock In/Out Card */}
                <Card className="padding-lg" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                            width: '8rem', height: '8rem', borderRadius: '50%',
                            background: todayLog?.checkIn ? 'var(--color-success-bg)' : 'var(--color-slate-100)',
                            color: todayLog?.checkIn ? 'var(--color-success)' : 'var(--color-text-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
                        }}>
                            <Clock size={48} />
                        </div>
                        <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{t('attendance.currentTime')}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        {!todayLog?.checkIn ? (
                            <Button size="lg" icon={<LogIn size={20} />} onClick={() => clockIn(currentEmployeeId)}>{t('attendance.clockIn')}</Button>
                        ) : !todayLog?.checkOut ? (
                            <Button size="lg" variant="outline" icon={<LogOut size={20} />} onClick={() => clockOut(currentEmployeeId)}>{t('attendance.clockOut')}</Button>
                        ) : (
                            <div style={{ padding: '1rem', background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', width: '100%' }}>
                                <CheckCircle size={20} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ fontWeight: 600 }}>{t('attendance.shiftCompleted')}</div>
                            </div>
                        )}
                    </div>

                    {todayLog && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem' }}>
                            <div>
                                <div style={{ color: 'var(--color-text-secondary)' }}>{t('attendance.checkIn')}</div>
                                <div style={{ fontWeight: 600 }}>{todayLog.checkIn}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--color-text-secondary)' }}>{t('attendance.checkOut')}</div>
                                <div style={{ fontWeight: 600 }}>{todayLog.checkOut || '--:--'}</div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Recent Logs */}
                <Card className="padding-lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('attendance.recentActivity')}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Filter size={14} color="var(--color-text-muted)" />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('attendance.from')}</span>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    style={{ padding: '0.25rem', fontSize: '0.75rem', width: 'auto' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('attendance.to')}</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    style={{ padding: '0.25rem', fontSize: '0.75rem', width: 'auto' }}
                                />
                            </div>
                            {(dateFrom || dateTo) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                                >
                                    {t('common:actions.reset')}
                                </Button>
                            )}
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>{t('attendance.date')}</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>{t('attendance.checkIn')}</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>{t('attendance.checkOut')}</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>{t('attendance.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>{log.date}</td>
                                    <td style={{ padding: '1rem' }}>{log.checkIn}</td>
                                    <td style={{ padding: '1rem' }}>{log.checkOut || '--:--'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem',
                                            background: log.status === 'Present' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                                            color: log.status === 'Present' ? 'var(--color-success)' : 'var(--color-warning)'
                                        }}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
};

export default Attendance;
