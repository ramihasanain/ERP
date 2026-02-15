import React, { createContext, useContext, useState, useEffect } from 'react';

const PayrollContext = createContext();

export const usePayroll = () => useContext(PayrollContext);

export const PayrollProvider = ({ children }) => {
    // --- 1. Master Data: Salary Components ---
    // Defines the 'Heads' available in the system (e.g., Basic, HRA, Transport)
    const [salaryComponents, setSalaryComponents] = useState([
        { id: 'COMP-001', code: 'BASIC', name: 'Basic Salary', type: 'Earning', calculationType: 'Fixed', isTaxable: true, glCode: '6001' },
        { id: 'COMP-002', code: 'HRA', name: 'Housing Allowance', type: 'Earning', calculationType: 'Fixed', isTaxable: true, glCode: '6002' },
        { id: 'COMP-003', code: 'TRANS', name: 'Transportation', type: 'Earning', calculationType: 'Fixed', isTaxable: true, glCode: '6003' },
        { id: 'COMP-004', code: 'OT', name: 'Overtime', type: 'Earning', calculationType: 'Formula', formula: '(BASIC / 30 / 8) * 1.5 * OT_HOURS', isTaxable: true, glCode: '6004' },
        { id: 'COMP-005', code: 'SS_EMP', name: 'Social Security (Employee)', type: 'Deduction', calculationType: 'Percentage', percentageOf: 'GROSS', value: 7.5, isTaxable: false, glCode: '2001' },
        { id: 'COMP-006', code: 'TAX', name: 'Income Tax', type: 'Deduction', calculationType: 'TaxSlab', isTaxable: false, glCode: '2002' },
    ]);

    // --- 2. Master Data: Salary Structures (Templates) ---
    // Groups components together directly (e.g., "Executive Structure", "Intern Structure")
    const [salaryStructures, setSalaryStructures] = useState([
        {
            id: 'STRUCT-001',
            name: 'Standard Full-Time',
            description: 'Standard structure for full-time employees',
            components: [
                { componentId: 'COMP-001', type: 'Fixed', value: 0 }, // Value 0 means it's pulled from Employee Contract
                { componentId: 'COMP-002', type: 'Fixed', value: 0 },
                { componentId: 'COMP-003', type: 'Fixed', value: 0 },
                { componentId: 'COMP-005', type: 'System', value: 0 },
                { componentId: 'COMP-006', type: 'System', value: 0 },
            ]
        }
    ]);

    // --- 3. Transaction Data: Payroll Periods ---
    const [payrollPeriods, setPayrollPeriods] = useState([
        { id: 'PER-2026-01', name: 'January 2026', startDate: '2026-01-01', endDate: '2026-01-31', status: 'Locked', paymentDate: '2026-01-28' },
        { id: 'PER-2026-02', name: 'February 2026', startDate: '2026-02-01', endDate: '2026-02-28', status: 'Draft', paymentDate: '' },
    ]);

    // --- 4. Settings: Tax Schemes (Groups of Slabs) ---
    const [taxSchemes, setTaxSchemes] = useState([
        { id: 'TAX-JO-STD', name: 'Jordan Standard Income Tax', rules: 'Standard 2026 Slabs' },
        { id: 'TAX-EXEMPT', name: 'Exempt / Non-Resident', rules: 'Zero Tax' },
    ]);

    const [taxSlabs, setTaxSlabs] = useState([
        { id: 1, min: 0, max: 5000, rate: 0 },
        { id: 2, min: 5001, max: 10000, rate: 5 },
        { id: 3, min: 10001, max: 20000, rate: 10 },
        { id: 4, min: 20001, max: 999999, rate: 20 },
    ]);

    // --- 5. Settings: Social Security Schemes ---
    const [socialSecuritySchemes, setSocialSecuritySchemes] = useState([
        { id: 'SS-JO-PRIV', name: 'Jordan Private Sector (7.5% Emp / 11% Co)', employeeRate: 7.5, employerRate: 11.0 },
        { id: 'SS-JO-PUB', name: 'Jordan Public Sector (9% Emp / 12% Co)', employeeRate: 9.0, employerRate: 12.0 },
        { id: 'SS-NONE', name: 'No Social Security (Outsourced/Expat)', employeeRate: 0, employerRate: 0 },
    ]);

    const [socialSecurityConfig, setSocialSecurityConfig] = useState({
        employeeRate: 7.5,
        employerRate: 11.0,
        minSalary: 145,
        maxSalary: 3500, // Salary Cap
        applyToEarnings: ['BASIC', 'HRA'], // Components included in SS calculation
    });

    // --- 6. End of Service / Final Settlements ---
    const [finalSettlements, setFinalSettlements] = useState([]);

    const calculateFinalSettlement = (employee, terminationData) => {
        if (!employee || !terminationData) return null;

        const joinDate = new Date(employee.joinDate);
        const endDate = new Date(terminationData.date);
        const diffTime = Math.abs(endDate - joinDate);
        const yearsOfService = diffTime / (1000 * 60 * 60 * 24 * 365.25);

        // Basic Salary and Allowances
        const basicSalary = employee.contract?.basicSalary || 0;
        const housingAllowance = employee.contract?.housingAllowance || 0;
        const transportationAllowance = employee.contract?.transportationAllowance || 0;
        const otherAllowance = employee.contract?.otherAllowance || 0;
        const grossSalary = basicSalary + housingAllowance + transportationAllowance + otherAllowance;

        const dailyRate = basicSalary / 30; // Usually based on Basic for Leave, sometimes Gross

        let gratuityAmount = 0;
        let ruleApplied = '';

        // Gratuity Calculation Logic
        if (yearsOfService < 1) {
            gratuityAmount = 0;
            ruleApplied = 'Less than 1 year - No Gratuity';
        } else {
            // Standard Formula: 0.5 month/year for first 5 years, 1 month/year thereafter
            const first5Years = Math.min(yearsOfService, 5);
            const after5Years = Math.max(0, yearsOfService - 5);

            let totalGratuity = (first5Years * 0.5 * basicSalary) + (after5Years * 1.0 * basicSalary);

            // Resignation Rule (Vesting)
            if (terminationData.type === 'Resignation') {
                if (yearsOfService < 2) {
                    totalGratuity = 0;
                    ruleApplied = 'Resignation < 2 years (0%)';
                } else if (yearsOfService < 5) {
                    totalGratuity = totalGratuity * (1 / 3);
                    ruleApplied = 'Resignation 2-5 years (1/3 vested)';
                } else if (yearsOfService < 10) {
                    totalGratuity = totalGratuity * (2 / 3);
                    ruleApplied = 'Resignation 5-10 years (2/3 vested)';
                } else {
                    ruleApplied = 'Resignation 10+ years (Fully vested)';
                }
            } else {
                ruleApplied = 'Full End of Service (Standard)';
            }
            gratuityAmount = totalGratuity;
        }

        // Leave Encashment
        const leaveBalance = 5; // Mock
        const leaveEncashment = leaveBalance * dailyRate;

        // Current Month Salary (Pro-rated)
        // If endDate is 15th, pay 15 days of Gross
        const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
        const daysWorked = endDate.getDate();
        const currentMonthSalary = (grossSalary / daysInMonth) * daysWorked;

        // Notice Period Pay
        // If notice is given but not worked (Payment in Lieu), we add this.
        // If worked, it's covered in salary (requires specific input if it extends beyond current month).
        // For simplicity, we calculate "Pay in Lieu value" available to be added.
        const noticePeriodDays = terminationData.noticePeriod || 30; // Default 30 if undefined
        const noticePeriodPay = (grossSalary / 30) * noticePeriodDays;

        return {
            basicSalary,
            grossSalary,
            yearsOfService,
            gratuityAmount,
            leaveEncashment,
            leaveBalance,
            currentMonthSalary,
            noticePeriodPay,
            ruleApplied,
            netPayable: gratuityAmount + leaveEncashment + currentMonthSalary, // Default Net (excluding notice pay)
            breakdown: [
                { label: 'Gratuity (EOSB)', amount: gratuityAmount, type: 'Addition' },
                { label: 'Leave Encashment', amount: leaveEncashment, type: 'Addition' },
                { label: 'Current Month Salary', amount: currentMonthSalary, type: 'Addition' }
            ]
        };
    };

    const addFinalSettlement = (settlement) => {
        setFinalSettlements(prev => [...prev, { ...settlement, id: `SET-${Date.now()}`, status: 'Draft' }]);
    };

    // --- Actions ---
    const addSalaryComponent = (component) => {
        setSalaryComponents(prev => [...prev, { ...component, id: `COMP-${Date.now()}` }]);
    };

    const updateSalaryComponent = (id, updatedComponent) => {
        setSalaryComponents(prev => prev.map(c => c.id === id ? { ...c, ...updatedComponent } : c));
    };

    const addSalaryStructure = (structure) => {
        setSalaryStructures(prev => [...prev, { ...structure, id: `STRUCT-${Date.now()}` }]);
    };

    const updateSalaryStructure = (id, updatedStructure) => {
        setSalaryStructures(prev => prev.map(s => s.id === id ? { ...s, ...updatedStructure } : s));
    };

    return (
        <PayrollContext.Provider value={{
            salaryComponents,
            salaryStructures,
            payrollPeriods,
            taxSlabs,
            taxSchemes,
            socialSecuritySchemes,
            addSalaryComponent,
            updateSalaryComponent,
            addSalaryStructure,
            updateSalaryStructure,
            setTaxSlabs,
            socialSecurityConfig,
            setSocialSecurityConfig,
            finalSettlements,
            setFinalSettlements,
            calculateFinalSettlement,
            addFinalSettlement
        }}>
            {children}
        </PayrollContext.Provider>
    );
};
