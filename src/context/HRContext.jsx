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

    // --- 6. Projects & Time Tracking ---
    const [projects, setProjects] = useState([
        { id: 'PRJ-001', name: 'ERP System Development', client: 'Internal', status: 'Active', startDate: '2025-01-01', endDate: '2025-12-31', description: 'Building the core ERP platform', assignedEmployees: [{ employeeId: 'EMP-001', role: 'Project Manager' }, { employeeId: 'EMP-002', role: 'Lead Developer' }, { employeeId: 'EMP-003', role: 'QA Engineer' }] },
        { id: 'PRJ-002', name: 'Mobile App Redesign', client: 'TechCo Inc.', status: 'Active', startDate: '2025-03-01', endDate: '2025-09-30', description: 'Redesigning the mobile application', assignedEmployees: [{ employeeId: 'EMP-002', role: 'Developer' }, { employeeId: 'EMP-004', role: 'Designer' }] },
        { id: 'PRJ-003', name: 'Cloud Migration', client: 'DataCorp', status: 'On Hold', startDate: '2025-06-01', endDate: '2026-03-31', description: 'Migrating services to AWS', assignedEmployees: [{ employeeId: 'EMP-001', role: 'Consultant' }] },
    ]);

    const [timeLogs, setTimeLogs] = useState([]);

    const addProject = (project) => {
        const newProject = { ...project, id: `PRJ-${Date.now()}`, assignedEmployees: project.assignedEmployees || [] };
        setProjects(prev => [...prev, newProject]);
        return newProject;
    };

    const updateProject = (id, updates) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deleteProject = (id) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const assignEmployeeToProject = (projectId, employeeId, role = 'Member') => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                if (p.assignedEmployees.find(e => e.employeeId === employeeId)) return p;
                return { ...p, assignedEmployees: [...p.assignedEmployees, { employeeId, role }] };
            }
            return p;
        }));
    };

    const removeEmployeeFromProject = (projectId, employeeId) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return { ...p, assignedEmployees: p.assignedEmployees.filter(e => e.employeeId !== employeeId) };
            }
            return p;
        }));
    };

    const startTimer = (employeeId, projectId, description = '') => {
        const newLog = {
            id: `TL-${Date.now()}`,
            employeeId,
            projectId,
            description,
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0
        };
        setTimeLogs(prev => [newLog, ...prev]);
        return newLog;
    };

    const stopTimer = (logId) => {
        setTimeLogs(prev => prev.map(log => {
            if (log.id === logId && !log.endTime) {
                const endTime = new Date().toISOString();
                const duration = Math.round((new Date(endTime) - new Date(log.startTime)) / 1000);
                return { ...log, endTime, duration };
            }
            return log;
        }));
    };

    const getActiveTimer = (employeeId) => {
        return timeLogs.find(log => log.employeeId === employeeId && !log.endTime);
    };

    const getEmployeeProjects = (employeeId) => {
        return projects.filter(p => p.assignedEmployees.some(e => e.employeeId === employeeId) && p.status === 'Active');
    };

    // --- 7. Contract Templates ---
    const [contractTemplates, setContractTemplates] = useState([
        {
            id: 'TPL-001',
            name: 'Standard Employment Contract',
            type: 'Full-Time',
            isDefault: true,
            lastModified: '2025-01-15',
            content: `EMPLOYMENT CONTRACT

This Employment Contract ("Contract") is entered into as of {{contract_start_date}}, by and between:

EMPLOYER:
Company Name: {{company_name}}
Address: {{company_address}}
Registration No: {{company_registration}}

EMPLOYEE:
Full Name: {{employee_full_name}}
National ID: {{employee_national_id}}
Address: {{employee_address}}

ARTICLE 1 - POSITION & DUTIES
The Employee is hereby employed as {{job_title}} in the {{department}} department, reporting to {{manager_name}}. The Employee shall perform all duties and responsibilities associated with this position.

ARTICLE 2 - CONTRACT TERM
This contract shall commence on {{contract_start_date}} and shall expire on {{contract_end_date}}, unless renewed or terminated in accordance with the terms herein.

ARTICLE 3 - COMPENSATION
3.1 Basic Salary: {{basic_salary}} {{currency}} per month
3.2 Housing Allowance: {{housing_allowance}} {{currency}} per month
3.3 Transportation Allowance: {{transportation_allowance}} {{currency}} per month
3.4 Other Allowances: {{other_allowance}} {{currency}} per month
3.5 Total Gross Salary: {{total_salary}} {{currency}} per month

Salary shall be paid on the last business day of each calendar month via bank transfer to the Employee's designated account.

ARTICLE 4 - WORKING HOURS
The standard working hours shall be 8 hours per day, 5 days a week (Sunday to Thursday), from 8:00 AM to 4:00 PM, with a one-hour lunch break.

ARTICLE 5 - PROBATION PERIOD
The first {{probation_period}} months of employment shall be considered a probation period. During this period, either party may terminate this contract with {{probation_notice}} days' written notice.

ARTICLE 6 - ANNUAL LEAVE
The Employee is entitled to {{annual_leave_days}} working days of paid annual leave per year, to be taken at times mutually agreed upon with the Employer.

ARTICLE 7 - SICK LEAVE
The Employee is entitled to sick leave in accordance with the Jordanian Labor Law, with full pay for the first 14 days and half pay for the subsequent 14 days per year.

ARTICLE 8 - SOCIAL SECURITY
Both parties shall contribute to the Social Security Corporation as required by law. The Employee's contribution shall be {{ss_employee_rate}}% of the basic salary.

ARTICLE 9 - TERMINATION
9.1 Either party may terminate this contract by providing {{notice_period}} days' written notice.
9.2 The Employer may terminate immediately for gross misconduct as defined by the Jordanian Labor Law.
9.3 Upon termination, the Employee shall receive end-of-service benefits as calculated per company policy and applicable law.

ARTICLE 10 - CONFIDENTIALITY
The Employee agrees to maintain the confidentiality of all proprietary information during and after the term of employment.

ARTICLE 11 - GOVERNING LAW
This contract shall be governed by the laws of the Hashemite Kingdom of Jordan and the Jordanian Labor Law No. 8 of 1996 and its amendments.

IN WITNESS WHEREOF, the parties have executed this Contract as of the date first written above.

EMPLOYER:                          EMPLOYEE:
Name: ___________________          Name: {{employee_full_name}}
Title: ___________________         Signature: ___________________
Signature: ___________________     Date: {{contract_start_date}}
Date: {{contract_start_date}}`
        },
        {
            id: 'TPL-002',
            name: 'Part-Time Contract',
            type: 'Part-Time',
            isDefault: false,
            lastModified: '2025-02-01',
            content: `PART-TIME EMPLOYMENT CONTRACT

Date: {{contract_start_date}}

BETWEEN:
Employer: {{company_name}}
Employee: {{employee_full_name}}

POSITION: {{job_title}} (Part-Time)
DEPARTMENT: {{department}}

TERM: From {{contract_start_date}} to {{contract_end_date}}

WORKING HOURS: {{working_hours}} hours per week
SCHEDULE: As agreed between the Employee and the direct supervisor.

COMPENSATION:
Basic Salary: {{basic_salary}} {{currency}} per month
Other Allowances: {{other_allowance}} {{currency}} per month

LEAVE: The Employee is entitled to {{annual_leave_days}} days of annual leave (pro-rated).

TERMINATION: Either party may terminate with {{notice_period}} days' notice.

All other terms and conditions shall follow company policy and applicable labor law.

Employer Signature: ___________________
Employee Signature: ___________________`
        }
    ]);

    const addContractTemplate = (template) => {
        const newTemplate = { ...template, id: `TPL-${Date.now()}`, lastModified: new Date().toISOString().split('T')[0] };
        setContractTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
    };

    const updateContractTemplate = (id, updates) => {
        setContractTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates, lastModified: new Date().toISOString().split('T')[0] } : t));
    };

    const deleteContractTemplate = (id) => {
        setContractTemplates(prev => prev.filter(t => t.id !== id));
    };

    const generateContract = (templateId, employeeId) => {
        const template = contractTemplates.find(t => t.id === templateId);
        const employee = employees.find(e => e.id === employeeId);
        if (!template || !employee) return null;

        const dept = departments.find(d => d.id === employee.departmentId);
        const pos = jobPositions.find(p => p.id === employee.positionId);
        const manager = employees.find(e => e.id === employee.managerId);
        const contract = employee.contract || {};

        const variables = {
            company_name: 'UnifiedCore Inc.',
            company_address: 'Amman, Jordan',
            company_registration: 'REG-2020-001',
            employee_full_name: `${employee.firstName} ${employee.lastName}`,
            employee_national_id: employee.nationalId || 'N/A',
            employee_address: employee.address || 'N/A',
            job_title: pos?.title || 'N/A',
            department: dept?.name || 'N/A',
            manager_name: manager ? `${manager.firstName} ${manager.lastName}` : 'N/A',
            contract_start_date: contract.startDate || new Date().toISOString().split('T')[0],
            contract_end_date: contract.endDate || 'Open-ended',
            basic_salary: contract.basicSalary?.toLocaleString() || '0',
            housing_allowance: (contract.housingAllowance || 0).toLocaleString(),
            transportation_allowance: (contract.transportationAllowance || 0).toLocaleString(),
            other_allowance: (contract.otherAllowance || 0).toLocaleString(),
            total_salary: ((contract.basicSalary || 0) + (contract.housingAllowance || 0) + (contract.transportationAllowance || 0) + (contract.otherAllowance || 0)).toLocaleString(),
            currency: contract.currency || 'JOD',
            probation_period: '3',
            probation_notice: '7',
            annual_leave_days: (contract.annualLeaveEntitlement || 14).toString(),
            ss_employee_rate: '7.5',
            notice_period: '30',
            working_hours: '40'
        };

        let result = template.content;
        Object.entries(variables).forEach(([key, val]) => {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
        });
        return result;
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
        terminateEmployee,
        evaluationCriteria,
        updateEvaluationCriteria,
        projects,
        addProject,
        updateProject,
        deleteProject,
        assignEmployeeToProject,
        removeEmployeeFromProject,
        timeLogs,
        startTimer,
        stopTimer,
        getActiveTimer,
        getEmployeeProjects,
        contractTemplates,
        addContractTemplate,
        updateContractTemplate,
        deleteContractTemplate,
        generateContract
    };

    return (
        <HRContext.Provider value={value}>
            {children}
        </HRContext.Provider>
    );
};
