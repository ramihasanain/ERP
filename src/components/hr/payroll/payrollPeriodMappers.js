const humanizeDetailKey = (key) =>
    String(key)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

export const mapPeriodLinesToRows = (period) => {
    const lines = Array.isArray(period?.lines) ? period.lines : [];
    return lines.map((line) => {
        const gross = Number(line.gross_pay) || 0;
        const totalDeductions = Number(line.deductions) || 0;
        const netPay = gross - totalDeductions;
        const earnings = line.earnings_details && typeof line.earnings_details === 'object' ? line.earnings_details : {};
        const deductionsDetail = line.deductions_details && typeof line.deductions_details === 'object' ? line.deductions_details : {};

        const breakdown = [];
        Object.entries(earnings).forEach(([k, v]) => {
            breakdown.push({ name: humanizeDetailKey(k), type: 'Earning', amount: Math.abs(Number(v) || 0) });
        });
        Object.entries(deductionsDetail).forEach(([k, v]) => {
            breakdown.push({ name: humanizeDetailKey(k), type: 'Deduction', amount: Math.abs(Number(v) || 0) });
        });

        let tax = 0;
        if (deductionsDetail.income_tax != null) {
            tax = Math.abs(Number(deductionsDetail.income_tax) || 0);
        }

        return {
            lineId: line.id,
            employeeId: line.employee_id,
            name: line.employee_name,
            department: line.department,
            gross,
            totalDeductions,
            tax,
            netPay,
            breakdown,
        };
    });
};
