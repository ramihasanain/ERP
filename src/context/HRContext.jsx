import React, { createContext, useContext, useState, useEffect } from 'react';

const HRContext = createContext();

export const useHR = () => {
    const context = useContext(HRContext);
    if (!context) {
        throw new Error('useHR must be used within an HRProvider');
    }
    return context;
};

export const HRProvider = ({ children }) => {
    // --- 1. Organizational Structure ---
    const [departments, setDepartments] = useState([
        { id: 'DEP-001', name: 'Executive Management', managerId: 'EMP-001', parentId: null },
        { id: 'DEP-002', name: 'Engineering', managerId: 'EMP-002', parentId: 'DEP-001' },
        { id: 'DEP-003', name: 'Sales & Marketing', managerId: 'EMP-003', parentId: 'DEP-001' },
        { id: 'DEP-004', name: 'Human Resources', managerId: 'EMP-004', parentId: 'DEP-001' },
        { id: 'DEP-005', name: 'Finance', managerId: 'EMP-005', parentId: 'DEP-001' },
    ]);

    const [jobPositions, setJobPositions] = useState([
        { id: 'POS-CEO', title: 'Chief Executive Officer', departmentId: 'DEP-001', grade: 10 },
        { id: 'POS-CTO', title: 'Chief Technology Officer', departmentId: 'DEP-002', grade: 9 },
        { id: 'POS-HRM', title: 'HR Manager', departmentId: 'DEP-004', grade: 7 },
        { id: 'POS-SEN-DEV', title: 'Senior Developer', departmentId: 'DEP-002', grade: 6 },
        { id: 'POS-JUN-DEV', title: 'Junior Developer', departmentId: 'DEP-002', grade: 4 },
        { id: 'POS-ACC', title: 'Accountant', departmentId: 'DEP-005', grade: 5 },
    ]);

    // --- 2. Employee Management ---
    // Expanded Employee Model
    const [employees, setEmployees] = useState([
        {
            id: 'EMP-001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'ceo@company.com',
            positionId: 'POS-CEO',
            departmentId: 'DEP-001',
            status: 'Active',
            joinDate: '2020-01-01',
            managerId: null,
            contract: {
                type: 'Full-Time',
                startDate: '2022-01-01',
                endDate: '2023-12-31',
                basicSalary: 5500,
                transportationAllowance: 150,
                housingAllowance: 0,
                otherAllowance: 0,
                socialSecurityDeduction: 412.5, // 7.5% est
                healthInsuranceDeduction: 50,
                otherDeduction: 0,
                currency: 'JOD',
                annualLeaveEntitlement: 21,
                salaryStructureId: 'STRUCT-001',
                taxSchemeId: 'TAX-JO-STD',
                ssSchemeId: 'SS-JO-PRIV'
            },
            contractHistory: [
                { id: 1, type: 'Full-Time', startDate: '2020-01-01', endDate: '2021-12-31', basicSalary: 4500, currency: 'JOD', document: 'contract_2020.pdf', status: 'Expired', salaryStructureId: 'STRUCT-001', taxSchemeId: 'TAX-JO-STD', ssSchemeId: 'SS-JO-PRIV', housingAllowance: 0, transportationAllowance: 100, otherAllowance: 0, socialSecurityDeduction: 337.5, healthInsuranceDeduction: 0, otherDeduction: 0 },
            ],
            bank: { bankName: 'Arab Bank', accountNumber: '123456789', iban: 'JO12ARAB0000000123456789' },
            salaryHistory: [
                { id: 1, date: '2020-01-01', amount: 4000, reason: 'Joining Salary' },
                { id: 2, date: '2022-01-01', amount: 5000, reason: 'Annual Raise' },
            ],
            evaluations: [
                { id: 1, date: '2022-12-31', rating: 5, comment: 'Excellent performance', evaluator: 'Board' },
            ],
            documents: [],
            leaves: [
                { id: 1, type: 'Annual', startDate: '2023-05-10', endDate: '2023-05-15', days: 5, status: 'Approved' },
                { id: 2, type: 'Sick', startDate: '2023-08-20', endDate: '2023-08-21', days: 2, status: 'Approved' },
                { id: 3, type: 'Unpaid', startDate: '2023-11-01', endDate: '2023-11-02', days: 2, status: 'Approved' },
            ]
        },
        {
            id: 'EMP-002',
            firstName: 'Sarah',
            lastName: 'Connor',
            email: 'tech@company.com',
            positionId: 'POS-CTO',
            departmentId: 'DEP-002',
            status: 'Active',
            joinDate: '2020-03-15',
            managerId: 'EMP-001',
            contract: { type: 'Full-Time', startDate: '2022-03-15', endDate: '2024-03-14', basicSalary: 4000, currency: 'JOD', annualLeaveEntitlement: 14, salaryStructureId: 'STRUCT-001', taxSchemeId: 'TAX-JO-STD', ssSchemeId: 'SS-JO-PRIV' },
            contractHistory: [
                { id: 1, type: 'Full-Time', startDate: '2020-03-15', endDate: '2022-03-14', basicSalary: 3500, currency: 'JOD', document: 'contract_v1.pdf' },
            ],
            bank: { bankName: 'Housing Bank', accountNumber: '987654321', iban: 'JO98HOUS0000000987654321' },
            salaryHistory: [
                { id: 1, date: '2020-03-15', amount: 3000, reason: 'Joining Salary' },
                { id: 2, date: '2021-03-15', amount: 3500, reason: 'Annual Raise' },
            ],
            evaluations: [
                { id: 1, date: '2021-12-31', rating: 4, comment: 'Great technical leadership', evaluator: 'John Doe' },
            ],
            documents: [],
            leaves: []
        },
        {
            id: 'EMP-003',
            firstName: 'Mike',
            lastName: 'Ross',
            email: 'sales@company.com',
            positionId: 'POS-HRM',
            departmentId: 'DEP-003',
            status: 'Active',
            joinDate: '2021-06-01',
            managerId: 'EMP-001',
            contract: {
                type: 'Full-Time',
                startDate: '2021-06-01',
                basicSalary: 2800,
                transportationAllowance: 100,
                housingAllowance: 200,
                socialSecurityDeduction: 210,
                healthInsuranceDeduction: 40,
                currency: 'JOD',
                annualLeaveEntitlement: 14,
                salaryStructureId: 'STRUCT-001',
                taxSchemeId: 'TAX-JO-STD',
                ssSchemeId: 'SS-JO-PRIV'
            },
            contractHistory: [],
            bank: {},
            salaryHistory: [],
            evaluations: [],
            documents: [],
            leaves: []
        },
        {
            id: 'EMP-004',
            firstName: 'Rachel',
            lastName: 'Zane',
            email: 'paralegal@company.com',
            positionId: 'POS-HRM',
            departmentId: 'DEP-003',
            status: 'Active',
            joinDate: '2022-02-01',
            managerId: 'EMP-003',
            contract: {
                type: 'Contract',
                startDate: '2022-02-01',
                endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires in 10 days
                basicSalary: 1500,
                currency: 'JOD',
                annualLeaveEntitlement: 10
            },
            contractHistory: [],
            bank: {},
            salaryHistory: [],
            evaluations: [],
            documents: [],
            leaves: []
        },
        {
            id: 'EMP-005',
            firstName: 'Donna',
            lastName: 'Paulsen',
            email: 'admin@company.com',
            positionId: 'POS-CEO',
            departmentId: 'DEP-001',
            status: 'Active',
            joinDate: '2019-05-15',
            managerId: 'EMP-001',
            contract: {
                type: 'Full-Time',
                startDate: '2023-01-01',
                endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires in 25 days
                basicSalary: 3200,
                transportationAllowance: 300,
                socialSecurityDeduction: 240,
                currency: 'JOD',
                annualLeaveEntitlement: 21
            },
            contractHistory: [],
            bank: {},
            salaryHistory: [],
            evaluations: [],
            documents: [],
            leaves: []
        },
    ]);

    // --- Actions ---
    const addDepartment = (dept) => {
        setDepartments(prev => [...prev, { ...dept, id: `DEP-${Date.now()}` }]);
    };

    const updateDepartment = (id, data) => {
        setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    };

    const deleteDepartment = (id) => {
        setDepartments(prev => prev.filter(d => d.id !== id));
    };

    const addPosition = (pos) => {
        setJobPositions(prev => [...prev, { ...pos, id: `POS-${Date.now()}` }]);
    };

    const updatePosition = (id, data) => {
        setJobPositions(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    };

    const deletePosition = (id) => {
        setJobPositions(prev => prev.filter(p => p.id !== id));
    };

    const updateEmployee = (id, data) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    };

    const addEmployee = (data) => {
        const newId = `EMP-${(employees.length + 1).toString().padStart(3, '0')}`;
        const newEmployee = { ...data, id: newId, status: 'Active', joinDate: new Date().toISOString().split('T')[0] };
        setEmployees(prev => [...prev, newEmployee]);
        return newId;
    };

    // --- 5. Evaluation Settings ---
    const [evaluationCriteria, setEvaluationCriteria] = useState([
        'Job Knowledge', 'Work Quality', 'Attendance', 'Communication', 'Initiative'
    ]);

    const updateEvaluationCriteria = (newCriteria) => {
        setEvaluationCriteria(newCriteria);
    };

    const terminateEmployee = (employeeId, terminationData) => {
        setEmployees(prev => prev.map(e => {
            if (e.id === employeeId) {
                return {
                    ...e,
                    status: 'Terminated',
                    terminationDate: terminationData.date,
                    terminationType: terminationData.type, // Resignation, Termination, End of Contract
                    terminationReason: terminationData.reason,
                    noticePeriodDays: terminationData.noticePeriod || 0
                };
            }
            return e;
        }));
    };

    const value = {
        departments,
        jobPositions,
        employees,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addPosition,
        updatePosition,
        deletePosition,
        setEmployees,
        updateEmployee,
        addEmployee,
        terminateEmployee, // Exported
        evaluationCriteria,
        updateEvaluationCriteria
    };

    return (
        <HRContext.Provider value={value}>
            {children}
        </HRContext.Provider>
    );
};
