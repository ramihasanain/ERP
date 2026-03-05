import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { User, FileText, CreditCard, ArrowLeft, Save, Upload, Plus, Calendar, Trash2, AlertTriangle, DollarSign, TrendingUp, XCircle } from 'lucide-react';
import { useHR } from '../../../context/HRContext';
import { usePayroll } from '../../../context/PayrollContext';
import Modal from '../../../components/common/Modal';
import TerminationModal from '../../../components/hr/TerminationModal';

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { employees, jobPositions, departments, updateEmployee, addEmployee, contractTemplates, generateContract } = useHR();
    const { salaryStructures, salaryComponents, taxSchemes, socialSecuritySchemes, taxSlabs } = usePayroll();
    const isNew = !id;

    // Find employee or use mock for new
    const initialData = isNew ? {
        firstName: '', lastName: '', email: '', phone: '', address: '',
        positionId: '', departmentId: '', managerId: '',
        status: 'Active',
        contract: { type: 'Full-Time', startDate: '', endDate: '', basicSalary: 0, currency: 'JOD', annualLeaveEntitlement: 14 },
        bank: { bankName: '', accountNumber: '', iban: '' },
        documents: [],
        joinDate: new Date().toISOString().split('T')[0],
        dob: '',
        nationality: ''
    } : employees.find(e => e.id === id) || {
        firstName: '', lastName: '', email: '', phone: '', address: '',
        positionId: '', departmentId: '', managerId: '',
        status: 'Active',
        contract: { type: 'Full-Time', startDate: '', endDate: '', basicSalary: 0, currency: 'JOD' },
        bank: { bankName: '', accountNumber: '', iban: '' },
        documents: [],
        contractHistory: []
    };

    const [activeTab, setActiveTab] = useState('overview');
    const [formData, setFormData] = useState(initialData);

    // Modal States
    const [isIncreaseModalOpen, setIsIncreaseModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [generatedContract, setGeneratedContract] = useState(null);
    const [increaseForm, setIncreaseForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', reason: '' });
    const [reviewForm, setReviewForm] = useState({
        startDate: '', endDate: '',
        jobKnowledge: 5, workQuality: 5, attendance: 5, communication: 5, initiative: 5,
        comment: '', evaluator: 'Current User'
    });

    const calculateScore = (form) => {
        const { jobKnowledge, workQuality, attendance, communication, initiative } = form;
        return ((jobKnowledge + workQuality + attendance + communication + initiative) / 5).toFixed(1);
    };

    const getClassification = (score) => {
        if (score >= 4.5) return { label: 'Excellent', color: 'var(--color-success-100)', text: 'var(--color-success-700)' };
        if (score >= 3.5) return { label: 'Good', color: 'var(--color-primary-100)', text: 'var(--color-primary-700)' };
        if (score >= 2.5) return { label: 'Fair', color: 'var(--color-warning-100)', text: 'var(--color-warning-700)' };
        return { label: 'Poor', color: 'var(--color-danger-100)', text: 'var(--color-danger-700)' };
    };

    const handleSave = () => {
        if (isNew) {
            const newId = addEmployee(formData);
            navigate(`/admin/hr/employees/${newId}`);
        } else {
            updateEmployee(id, formData);
        }
    };

    const handleTerminationConfirm = (data) => {
        setIsTerminationModalOpen(false);
        navigate('/admin/hr/final-settlement', { state: { employeeId: id, terminationData: data } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/admin/hr/employees')} />
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{isNew ? 'Add New Employee' : `${formData.firstName} ${formData.lastName}`}</h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{isNew ? 'Create a new employee profile' : formData.id}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isNew && (
                        <Button
                            variant="outline"
                            style={{ borderColor: 'var(--color-danger-200)', color: 'var(--color-danger-700)', background: 'var(--color-danger-50)' }}
                            icon={<XCircle size={16} />}
                            onClick={() => setIsTerminationModalOpen(true)}
                        >
                            End Service
                        </Button>
                    )}
                    <Button icon={<Save size={16} />} onClick={handleSave}>{isNew ? 'Create Employee' : 'Save Changes'}</Button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '2rem' }}>
                <TabButton label="Overview" icon={<User size={18} />} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton label="Contract & Salary" icon={<FileText size={18} />} active={activeTab === 'contract'} onClick={() => setActiveTab('contract')} />
                <TabButton label="Banking" icon={<CreditCard size={18} />} active={activeTab === 'banking'} onClick={() => setActiveTab('banking')} />

                <TabButton label="Leaves" icon={<Calendar size={18} />} active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} />
                <TabButton label="Documents" icon={<FileText size={18} />} active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                    <Card className="padding-lg">
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '6rem', height: '6rem', borderRadius: '50%', background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '2rem', margin: '0 auto 1rem' }}>
                                {formData.firstName?.[0]}{formData.lastName?.[0]}
                            </div>
                            <Button variant="outline" size="sm" icon={<Upload size={14} />}>Change Photo</Button>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Contact Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input label="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </Card>

                    <Card className="padding-lg">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Personal Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <Input label="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            <Input label="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                            <Input label="Nationality" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />

                            <div style={{ gridColumn: 'span 2' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', marginTop: '1rem' }}>Job Details</h3>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Department</label>
                                <select
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                    value={formData.departmentId}
                                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Position</label>
                                <select
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                    value={formData.positionId}
                                    onChange={e => setFormData({ ...formData, positionId: e.target.value })}
                                >
                                    <option value="">Select Position</option>
                                    {jobPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>

                            <Input label="Joining Date" type="date" value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} />

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
                                <select
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Terminated">Terminated</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            {activeTab === 'banking' && (
                <Card className="padding-lg">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Bank Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <Input
                                label="Bank Name"
                                value={formData.bank?.bankName || ''}
                                onChange={e => setFormData({ ...formData, bank: { ...formData.bank, bankName: e.target.value } })}
                                placeholder="e.g. Arab Bank"
                            />
                        </div>
                        <Input
                            label="Account Number"
                            value={formData.bank?.accountNumber || ''}
                            onChange={e => setFormData({ ...formData, bank: { ...formData.bank, accountNumber: e.target.value } })}
                            placeholder="123456789"
                        />
                        <Input
                            label="IBAN"
                            value={formData.bank?.iban || ''}
                            onChange={e => setFormData({ ...formData, bank: { ...formData.bank, iban: e.target.value } })}
                            placeholder="JO..."
                        />
                        <div style={{ gridColumn: 'span 2', padding: '1rem', background: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>Note:</span>
                            Used for automated payroll transfers. Ensure IBAN is correct to avoid payment delays.
                        </div>
                    </div>
                </Card>
            )}

            {activeTab === 'contract' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <Card className="padding-lg">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Contract Details</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    {/* Contract Status / Countdown */}
                                    {formData.contract?.endDate && (
                                        <div style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                            background: new Date(formData.contract.endDate) < new Date() ? 'var(--color-danger-100)' :
                                                (new Date(formData.contract.endDate) - new Date()) / (1000 * 60 * 60 * 24) < 30 ? 'var(--color-warning-100)' : 'var(--color-success-100)',
                                            color: new Date(formData.contract.endDate) < new Date() ? 'var(--color-danger-800)' :
                                                (new Date(formData.contract.endDate) - new Date()) / (1000 * 60 * 60 * 24) < 30 ? 'var(--color-warning-800)' : 'var(--color-success-800)'
                                        }}>
                                            {new Date(formData.contract.endDate) < new Date() ? 'Expired' :
                                                `${Math.ceil((new Date(formData.contract.endDate) - new Date()) / (1000 * 60 * 60 * 24))} Days Remaining`}
                                        </div>
                                    )}
                                    <Button size="sm" variant="outline" onClick={() => setIsRenewalModalOpen(true)}>Renew Contract</Button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Contract Type</label>
                                    <select
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                        value={formData.contract?.type || 'Full-Time'}
                                        onChange={e => setFormData({ ...formData, contract: { ...formData.contract, type: e.target.value } })}
                                    >
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Contract">Contract / Consultant</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>

                                <Input
                                    label="Contract Start Date"
                                    type="date"
                                    value={formData.contract?.startDate || ''}
                                    onChange={e => setFormData({ ...formData, contract: { ...formData.contract, startDate: e.target.value } })}
                                />

                                <Input
                                    label="Contract End Date (Optional)"
                                    type="date"
                                    value={formData.contract?.endDate || ''}
                                    onChange={e => setFormData({ ...formData, contract: { ...formData.contract, endDate: e.target.value } })}
                                />

                                <Input
                                    label="Annual Leave Entitlement (Days)"
                                    type="number"
                                    value={formData.contract?.annualLeaveEntitlement || ''}
                                    onChange={e => setFormData({ ...formData, contract: { ...formData.contract, annualLeaveEntitlement: parseInt(e.target.value) || 0 } })}
                                    placeholder="e.g. 14"
                                />

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-700)' }}>Generate Contract from Template</label>
                                    <div style={{ border: '2px solid var(--color-primary-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', background: 'linear-gradient(to bottom right, white, var(--color-primary-50))' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 500 }}>Template</label>
                                                <select
                                                    style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                                    value={selectedTemplateId}
                                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                                >
                                                    <option value="">Select template...</option>
                                                    {contractTemplates.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} ({t.type}){t.isDefault ? ' ⭐' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Button
                                                size="sm"
                                                disabled={!selectedTemplateId || !id}
                                                onClick={() => {
                                                    const content = generateContract(selectedTemplateId, id);
                                                    if (content) {
                                                        setGeneratedContract(content);
                                                        // Save template ID to employee contract
                                                        setFormData(prev => ({ ...prev, contract: { ...prev.contract, templateId: selectedTemplateId, generatedContract: content } }));
                                                    }
                                                }}
                                            >
                                                Generate
                                            </Button>
                                        </div>

                                        {generatedContract && (
                                            <div style={{ marginTop: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-success)' }}>✓ Contract Generated</span>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => navigator.clipboard.writeText(generatedContract)} style={{ fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Copy</button>
                                                        <button onClick={() => {
                                                            const pw = window.open('', '_blank');
                                                            pw.document.write(`<html><head><title>Contract</title><style>body{font-family:'Times New Roman',serif;padding:60px;line-height:1.8;font-size:14px;white-space:pre-wrap;}</style></head><body>${generatedContract}</body></html>`);
                                                            pw.document.close();
                                                            pw.print();
                                                        }} style={{ fontSize: '0.75rem', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Print</button>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    maxHeight: '200px', overflow: 'auto', padding: '0.75rem',
                                                    background: 'white', border: '1px solid var(--color-border)', borderRadius: '6px',
                                                    fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: 1.5, whiteSpace: 'pre-wrap'
                                                }}>
                                                    {generatedContract}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <Card className="padding-lg">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Salary & Compensation</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-700)', textTransform: 'uppercase' }}>Salary Structure</label>
                                            <select
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-primary-100)', background: 'var(--color-primary-50)', fontWeight: 600 }}
                                                value={formData.contract?.salaryStructureId || ''}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, salaryStructureId: e.target.value } })}
                                            >
                                                <option value="">-- Assign Salary Structure --</option>
                                                {salaryStructures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                Assigning a structure will automatically apply defined components during payroll processing.
                                            </p>
                                        </div>
                                        <Input
                                            label="Basic Salary"
                                            type="number"
                                            value={formData.contract?.basicSalary || ''}
                                            onChange={e => setFormData({ ...formData, contract: { ...formData.contract, basicSalary: parseFloat(e.target.value) || 0 } })}
                                            placeholder="0.00"
                                        />
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Currency</label>
                                            <select
                                                style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                                value={formData.contract?.currency || 'JOD'}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, currency: e.target.value } })}
                                            >
                                                <option value="JOD">JOD</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="SAR">SAR</option>
                                                <option value="AED">AED</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Structure Preview */}
                                    {formData.contract?.salaryStructureId && (
                                        <div style={{ background: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Structure Components Preview</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {salaryStructures.find(s => s.id === formData.contract.salaryStructureId)?.components.map(compItem => {
                                                    const master = salaryComponents.find(c => c.id === compItem.componentId);
                                                    return (
                                                        <div key={compItem.componentId} style={{ padding: '0.35rem 0.6rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <span style={{ fontWeight: 600 }}>{master?.name}:</span>
                                                            <span style={{ color: master?.type === 'Earning' ? 'var(--color-success-700)' : 'var(--color-error-700)' }}>
                                                                {compItem.value > 0 ? `${compItem.value} (Fixed)` : 'Variable'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Allowances Section */}
                                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-success-700)' }}>Allowances (+)</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                            <Input
                                                label="Transportation"
                                                type="number"
                                                value={formData.contract?.transportationAllowance || ''}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, transportationAllowance: parseFloat(e.target.value) || 0 } })}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Housing"
                                                type="number"
                                                value={formData.contract?.housingAllowance || ''}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, housingAllowance: parseFloat(e.target.value) || 0 } })}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Other Allowances"
                                                type="number"
                                                value={formData.contract?.otherAllowance || ''}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, otherAllowance: parseFloat(e.target.value) || 0 } })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Deductions Section */}
                                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-danger-700)' }}>Deductions (-)</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                            <Input
                                                label="Social Security"
                                                type="number"
                                                value={formData.contract?.socialSecurityDeduction || ''}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, socialSecurityDeduction: parseFloat(e.target.value) || 0 } })}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Health Insurance"
                                                type="number"
                                                value={formData.contract?.healthInsuranceDeduction || ''}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, healthInsuranceDeduction: parseFloat(e.target.value) || 0 } })}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Other Deductions"
                                                type="number"
                                                value={formData.contract?.otherDeduction || ''}
                                                onChange={e => setFormData({ ...formData, contract: { ...formData.contract, otherDeduction: parseFloat(e.target.value) || 0 } })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Net Salary Calculation (Real-time Reflection) */}
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-200)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-800)', marginBottom: '0.25rem' }}>Estimated Net Salary</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>(Based on selected Structure & Schemes)</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-800)' }}>
                                                {(() => {
                                                    const basic = formData.contract?.basicSalary || 0;
                                                    const housing = formData.contract?.housingAllowance || 0;
                                                    const trans = formData.contract?.transportationAllowance || 0;
                                                    const otherAllow = formData.contract?.otherAllowance || 0;
                                                    const gross = basic + housing + trans + otherAllow;

                                                    // Dynamic SS Deduction
                                                    let ssRate = 7.5; // Default fallback
                                                    if (formData.contract?.ssSchemeId) {
                                                        ssRate = socialSecuritySchemes.find(s => s.id === formData.contract.ssSchemeId)?.employeeRate || 0;
                                                    }
                                                    const ssDeduction = gross * (ssRate / 100);

                                                    // Dynamic Tax (Simplified Slab)
                                                    let taxAmount = 0;
                                                    if (formData.contract?.taxSchemeId !== 'TAX-EXEMPT') {
                                                        const slab = taxSlabs.find(s => gross >= s.min && gross <= s.max);
                                                        if (slab) taxAmount = gross * (slab.rate / 100);
                                                    }

                                                    const health = formData.contract?.healthInsuranceDeduction || 0;
                                                    const otherDed = formData.contract?.otherDeduction || 0;

                                                    return (gross - (ssDeduction + taxAmount + health + otherDed)).toLocaleString();
                                                })()} {formData.contract?.currency}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Contract History Table (Small) */}
                            <Card className="padding-lg">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Contract History</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                                            <th style={{ padding: '0.5rem' }}>Period</th>
                                            <th style={{ padding: '0.5rem' }}>Salary</th>
                                            <th style={{ padding: '0.5rem' }}>Document</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.contractHistory?.map((c, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <div>{c.startDate}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>to {c.endDate || 'Present'}</div>
                                                </td>
                                                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.basicSalary?.toLocaleString()} {c.currency}</td>
                                                <td style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {c.document ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary-600)', cursor: 'pointer' }}><FileText size={14} /> Open</span> : <span>-</span>}
                                                        <Button variant="ghost" size="sm" icon={<TrendingUp size={14} />} onClick={() => setSelectedHistory(c)}>View</Button>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        if (window.confirm('Are you sure you want to permanently delete this contract record?')) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                contractHistory: prev.contractHistory.filter((_, index) => index !== i)
                                                            }));
                                                        }
                                                    }} style={{ color: 'var(--color-danger-700)', borderColor: 'var(--color-danger-200)', background: 'var(--color-danger-50)' }}>
                                                        <Trash2 size={14} style={{ marginRight: '0.25rem' }} /> Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!formData.contractHistory || formData.contractHistory.length === 0) && (
                                            <tr><td colSpan="3" style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No history</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    </div>

                    {/* Salary History Section */}
                    <Card className="padding-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Salary History</h3>
                            <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setIsIncreaseModalOpen(true)}>Add Increase</Button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                                    <th style={{ padding: '0.75rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem' }}>Amount</th>
                                    <th style={{ padding: '0.75rem' }}>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.salaryHistory?.map(Record => (
                                    <tr key={Record.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem' }}>{Record.date}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{Record.amount.toLocaleString()} {formData.contract?.currency}</td>
                                        <td style={{ padding: '0.75rem' }}>{Record.reason}</td>
                                    </tr>
                                ))}
                                {(!formData.salaryHistory || formData.salaryHistory.length === 0) && (
                                    <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No history available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </Card>

                    {/* Performance Evaluations Section */}
                    <Card className="padding-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Performance Evaluations</h3>
                            <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setIsReviewModalOpen(true)}>Add Review</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {formData.evaluations?.map(evalItem => {
                                const score = evalItem.score || evalItem.rating; // Fallback for old simple ratings
                                const classification = evalItem.classification || getClassification(score).label;
                                const colorProps = getClassification(score);

                                return (
                                    <div key={evalItem.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                                                    {evalItem.startDate ? `${evalItem.startDate} - ${evalItem.endDate}` : evalItem.date}
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Evaluated by {evalItem.evaluator}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ background: colorProps.color, color: colorProps.text, padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', marginBottom: '0.25rem' }}>
                                                    {classification}
                                                </span>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: colorProps.text }}>
                                                    {score} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>/ 5</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', background: 'var(--color-slate-50)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>
                                            "{evalItem.comment}"
                                        </p>

                                        {/* Dynamic Criteria Display */}
                                        {evalItem.ratings && (
                                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                                {Object.entries(evalItem.ratings).map(([key, value]) => (
                                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{key}:</span>
                                                        <span style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Fallback for Old Static Criteria (Backward Compatibility) */}
                                        {!evalItem.ratings && evalItem.jobKnowledge && (
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                                <span title="Job Knowledge">📚 {evalItem.jobKnowledge}</span>
                                                <span title="Work Quality">⭐ {evalItem.workQuality}</span>
                                                <span title="Attendance">⏰ {evalItem.attendance}</span>
                                                <span title="Communication">💬 {evalItem.communication}</span>
                                                <span title="Initiative">💡 {evalItem.initiative}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {(!formData.evaluations || formData.evaluations.length === 0) && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)' }}>
                                    No evaluations recorded yet.
                                </div>
                            )}
                        </div>
                    </Card>
                </div >
            )}



            {
                activeTab === 'leaves' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Leave Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <Card className="padding-md" style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Annual Entitlement</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                                    {formData.contract?.annualLeaveEntitlement || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>days</span>
                                </div>
                            </Card>

                            <Card className="padding-md">
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Used Annual Leave</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {formData.leaves?.filter(l => l.type === 'Annual' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0) || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>days</span>
                                </div>
                            </Card>

                            <Card className="padding-md">
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Remaining Balance</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: (formData.contract?.annualLeaveEntitlement - (formData.leaves?.filter(l => l.type === 'Annual' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0) || 0)) < 0 ? 'var(--color-danger-600)' : 'var(--color-success-600)' }}>
                                    {(formData.contract?.annualLeaveEntitlement || 0) - (formData.leaves?.filter(l => l.type === 'Annual' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0) || 0)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>days</span>
                                </div>
                            </Card>

                            <Card className="padding-md">
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Sick Leave Taken</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning-700)' }}>
                                    {formData.leaves?.filter(l => l.type === 'Sick' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0) || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>days</span>
                                </div>
                            </Card>

                            <Card className="padding-md">
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Unpaid Leave</h4>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger-600)' }}>
                                    {formData.leaves?.filter(l => l.type === 'Unpaid' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0) || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>days</span>
                                </div>
                            </Card>
                        </div>

                        {/* Leave History Table */}
                        <Card className="padding-lg">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Leave History</h3>
                                <Button variant="outline" size="sm" icon={<Plus size={14} />}>Add Leave Record</Button>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                                        <th style={{ padding: '0.75rem' }}>Type</th>
                                        <th style={{ padding: '0.75rem' }}>Start Date</th>
                                        <th style={{ padding: '0.75rem' }}>End Date</th>
                                        <th style={{ padding: '0.75rem' }}>Days</th>
                                        <th style={{ padding: '0.75rem' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.leaves?.map(leave => (
                                        <tr key={leave.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                                    background: leave.type === 'Annual' ? 'var(--color-primary-100)' : leave.type === 'Sick' ? 'var(--color-warning-100)' : 'var(--color-slate-100)',
                                                    color: leave.type === 'Annual' ? 'var(--color-primary-700)' : leave.type === 'Sick' ? 'var(--color-warning-800)' : 'var(--color-slate-700)'
                                                }}>
                                                    {leave.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{leave.startDate}</td>
                                            <td style={{ padding: '0.75rem' }}>{leave.endDate}</td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{leave.days}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ color: 'var(--color-success-600)', fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!formData.leaves || formData.leaves.length === 0) && (
                                        <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No leave history available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )
            }

            {
                activeTab === 'documents' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <Card className="padding-lg">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Employee Documents</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Securely store private documents here.</p>
                                </div>
                                <Button icon={<Upload size={16} />}>Upload Document</Button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {/* Upload Area */}
                                <div style={{
                                    border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '2rem', cursor: 'pointer', background: 'var(--color-slate-50)', height: '100%'
                                }}>
                                    <Upload size={32} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Upload New</span>
                                </div>

                                {/* Mock Documents */}
                                <div style={{
                                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '160px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <FileText size={32} color="var(--color-primary-600)" />
                                        <div style={{ padding: '0.25rem 0.5rem', background: 'var(--color-slate-100)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>PDF</div>
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Passport Copy</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Added on Jan 15, 2023</p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button variant="ghost" size="sm">Download</Button>
                                    </div>
                                </div>

                                <div style={{
                                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '160px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <FileText size={32} color="var(--color-primary-600)" />
                                        <div style={{ padding: '0.25rem 0.5rem', background: 'var(--color-slate-100)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>PDF</div>
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>University Degree</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Added on Jan 15, 2023</p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button variant="ghost" size="sm">Download</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }
            <Modal
                isOpen={isIncreaseModalOpen}
                onClose={() => setIsIncreaseModalOpen(false)}
                title="Add Salary Increase"
                size="sm"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Effective Date"
                        type="date"
                        value={increaseForm.date}
                        onChange={e => setIncreaseForm({ ...increaseForm, date: e.target.value })}
                    />
                    <Input
                        label="New Basic Salary Amount"
                        type="number"
                        value={increaseForm.amount}
                        onChange={e => setIncreaseForm({ ...increaseForm, amount: e.target.value })}
                        placeholder="e.g. 5000"
                    />
                    <Input
                        label="Reason"
                        value={increaseForm.reason}
                        onChange={e => setIncreaseForm({ ...increaseForm, reason: e.target.value })}
                        placeholder="e.g. Annual Appraisal"
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsIncreaseModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            if (!increaseForm.amount || !increaseForm.date) return alert('Please fill required fields');
                            const newRecord = { id: Date.now(), ...increaseForm, amount: parseFloat(increaseForm.amount) };
                            setFormData(prev => ({
                                ...prev,
                                salaryHistory: [...(prev.salaryHistory || []), newRecord],
                                contract: { ...prev.contract, basicSalary: parseFloat(increaseForm.amount) } // Update current salary
                            }));
                            setIsIncreaseModalOpen(false);
                            setIncreaseForm({ date: new Date().toISOString().split('T')[0], amount: '', reason: '' });
                        }}>Save Increase</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title="Add Performance Evaluation"
                size="lg"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Review Period Start"
                            type="date"
                            value={reviewForm.startDate}
                            onChange={e => setReviewForm({ ...reviewForm, startDate: e.target.value })}
                        />
                        <Input
                            label="Review Period End"
                            type="date"
                            value={reviewForm.endDate}
                            onChange={e => setReviewForm({ ...reviewForm, endDate: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--color-slate-50)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        {['Job Knowledge', 'Work Quality', 'Attendance', 'Communication', 'Initiative'].map((criteria) => {
                            const key = criteria.replace(' ', '').replace('&', '');
                            const stateKey = key.charAt(0).toLowerCase() + key.slice(1);

                            // Map friendly name to state key
                            const mapKey = {
                                'Job Knowledge': 'jobKnowledge',
                                'Work Quality': 'workQuality',
                                'Attendance': 'attendance',
                                'Communication': 'communication',
                                'Initiative': 'initiative'
                            }[criteria];

                            return (
                                <div key={criteria}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        <span>{criteria}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>{reviewForm[mapKey]}/5</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1" max="5" step="1"
                                        value={reviewForm[mapKey]}
                                        onChange={e => setReviewForm({ ...reviewForm, [mapKey]: parseInt(e.target.value) })}
                                        style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                        <span>Poor</span>
                                        <span>Excellent</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-100)' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Calculated Score</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-700)' }}>{calculateScore(reviewForm)} / 5.0</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Rating Class</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary-700)' }}>{getClassification(calculateScore(reviewForm)).label}</span>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Evaluator Comments</label>
                        <textarea
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)', minHeight: '100px', fontFamily: 'inherit'
                            }}
                            value={reviewForm.comment}
                            onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder="Enter detailed feedback..."
                        />
                    </div>
                    <Input
                        label="Evaluator Name"
                        value={reviewForm.evaluator}
                        onChange={e => setReviewForm({ ...reviewForm, evaluator: e.target.value })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            if (!reviewForm.startDate || !reviewForm.endDate || !reviewForm.comment) return alert('Please fill required fields');
                            const score = calculateScore(reviewForm);
                            const newReview = {
                                id: Date.now(),
                                ...reviewForm,
                                score: score,
                                classification: getClassification(score).label
                            };
                            setFormData(prev => ({
                                ...prev,
                                evaluations: [...(prev.evaluations || []), newReview]
                            }));
                            setIsReviewModalOpen(false);
                            setReviewForm({
                                startDate: '', endDate: '',
                                jobKnowledge: 5, workQuality: 5, attendance: 5, communication: 5, initiative: 5,
                                comment: '', evaluator: 'Current User'
                            });
                        }}>Save Evaluation</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isRenewalModalOpen}
                onClose={() => setIsRenewalModalOpen(false)}
                title="Confirm Contract Renewal"
                size="sm"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ready to renew?</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            This will archive the current contract (ending <strong>{formData.contract?.endDate || 'N/A'}</strong>) to history and create a new contract period starting today.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', background: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Current Salary</span>
                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{formData.contract?.basicSalary?.toLocaleString()} {formData.contract?.currency}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>New Start Date</span>
                            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-primary-600)' }}>{new Date().toISOString().split('T')[0]}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsRenewalModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            const oldContract = { ...formData.contract, id: Date.now(), status: 'Expired/Renewed' };
                            setFormData(prev => ({
                                ...prev,
                                contractHistory: [...(prev.contractHistory || []), oldContract],
                                contract: { ...prev.contract, startDate: new Date().toISOString().split('T')[0], endDate: '' }
                            }));
                            setIsRenewalModalOpen(false);
                        }}>Confirm Renewal</Button>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={!!selectedHistory}
                onClose={() => setSelectedHistory(null)}
                title="Historical Contract Details"
                size="lg"
            >
                {selectedHistory && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* General Info */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Contract Info</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <DetailRow label="Period" value={`${selectedHistory.startDate} to ${selectedHistory.endDate || 'Present'}`} />
                                    <DetailRow label="Type" value={selectedHistory.type} />
                                    <DetailRow label="Status" value={selectedHistory.status || 'Archived'} />
                                    <DetailRow label="Currency" value={selectedHistory.currency} />
                                </div>
                            </div>

                            {/* Compliance Info */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Compliance & Structure</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <DetailRow label="Salary Structure" value={salaryStructures.find(s => s.id === selectedHistory.salaryStructureId)?.name || 'Manual / Custom'} />
                                </div>
                            </div>
                        </div>

                        {/* Financial Breakdown */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Salary Breakdown</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <FinancialCard label="Basic Salary" value={selectedHistory.basicSalary} currency={selectedHistory.currency} />
                                <FinancialCard label="Allowances" value={(selectedHistory.housingAllowance || 0) + (selectedHistory.transportationAllowance || 0) + (selectedHistory.otherAllowance || 0)} currency={selectedHistory.currency} color="var(--color-success-600)" />
                                <FinancialCard label="Deductions" value={(selectedHistory.socialSecurityDeduction || 0) + (selectedHistory.healthInsuranceDeduction || 0) + (selectedHistory.otherDeduction || 0)} currency={selectedHistory.currency} color="var(--color-danger-600)" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button onClick={() => setSelectedHistory(null)}>Close View</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <TerminationModal
                isOpen={isTerminationModalOpen}
                onClose={() => setIsTerminationModalOpen(false)}
                employee={formData}
                onConfirm={handleTerminationConfirm}
            />
        </div>

    );
};

const TabButton = ({ label, icon, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem',
            border: 'none', background: 'transparent', cursor: 'pointer',
            borderBottom: active ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            color: active ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            fontWeight: active ? 600 : 500
        }}
    >
        {icon}
        {label}
    </button>
);

const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.5rem' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{value || 'N/A'}</span>
    </div>
);

const FinancialCard = ({ label, value, currency, color }) => (
    <div style={{ padding: '1rem', background: 'var(--color-slate-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: color || 'var(--color-text-primary)' }}>{value?.toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{currency}</span></span>
    </div>
);

export default EmployeeDetails;
