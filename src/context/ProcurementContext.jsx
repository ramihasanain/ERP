import React, { createContext, useContext, useState, useEffect } from 'react';

const ProcurementContext = createContext();

export const useProcurement = () => useContext(ProcurementContext);

const initialPurchaseOrders = [
    {
        id: 'PO-2025-001',
        vendorId: 'VEN-001',
        vendorName: 'Office Supplies Co.',
        date: '2025-02-10',
        expectedDate: '2025-02-15',
        status: 'Approved',
        totalAmount: 450.00,
        items: [
            { itemId: '1', name: 'Office Chair', quantity: 5, unitCost: 45, totalCost: 225 },
            { itemId: '2', name: 'Laptop Stand', quantity: 15, unitCost: 15, totalCost: 225 }
        ],
        approvalLog: [
            { stage: 'Submission', user: 'Admin', date: '2025-02-10T10:00:00Z', status: 'Submitted' },
            { stage: 'Manager Approval', user: 'Finance Manager', date: '2025-02-10T14:00:00Z', status: 'Approved' }
        ]
    },
    {
        id: 'PO-2025-002',
        vendorId: 'VEN-002',
        vendorName: 'Tech Wholesalers',
        date: '2025-02-14',
        expectedDate: '2025-02-20',
        status: 'Draft',
        totalAmount: 1200.00,
        items: [
            { itemId: '2', name: 'Laptop Stand', quantity: 80, unitCost: 15, totalCost: 1200 }
        ],
        approvalLog: []
    }
];

export const ProcurementProvider = ({ children }) => {
    const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
    const [vendorInvoices, setVendorInvoices] = useState([]);

    // --- Actions ---

    // 1. Purchase Orders
    const addPurchaseOrder = (po) => {
        const newPO = {
            ...po,
            id: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
            status: 'Draft',
            approvalLog: []
        };
        setPurchaseOrders(prev => [newPO, ...prev]);
        return newPO;
    };

    const updatePurchaseOrder = (id, updatedData) => {
        setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, ...updatedData } : po));
    };

    const deletePurchaseOrder = (id) => {
        setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    };

    // Workflow Actions
    const submitPO = (id, user = 'Current User') => {
        setPurchaseOrders(prev => prev.map(po => {
            if (po.id === id) {
                return {
                    ...po,
                    status: 'Pending Approval',
                    approvalLog: [...po.approvalLog, { stage: 'Submission', user, date: new Date().toISOString(), status: 'Submitted' }]
                };
            }
            return po;
        }));
    };

    const approvePO = (id, user = 'Approver') => {
        setPurchaseOrders(prev => prev.map(po => {
            if (po.id === id) {
                return {
                    ...po,
                    status: 'Approved',
                    approvalLog: [...po.approvalLog, { stage: 'Manager Approval', user, date: new Date().toISOString(), status: 'Approved' }]
                };
            }
            return po;
        }));
    };

    const rejectPO = (id, reason, user = 'Approver') => {
        setPurchaseOrders(prev => prev.map(po => {
            if (po.id === id) {
                return {
                    ...po,
                    status: 'Rejected',
                    rejectionReason: reason,
                    approvalLog: [...po.approvalLog, { stage: 'Manager Approval', user, date: new Date().toISOString(), status: 'Rejected', reason }]
                };
            }
            return po;
        }));
    };

    // 2. Vendor Invoices (Bills)
    const checkVendorInvoiceExists = (vendorId, invoiceNumber) => {
        return vendorInvoices.some(bill => bill.vendorId === vendorId && bill.vendorInvoiceNumber === invoiceNumber);
    };

    const addVendorInvoice = (invoice) => {
        // Validation: Duplicate check
        if (checkVendorInvoiceExists(invoice.vendorId, invoice.vendorInvoiceNumber)) {
            throw new Error(`Invoice #${invoice.vendorInvoiceNumber} already exists for this vendor.`);
        }

        const nextSeq = String(vendorInvoices.length + 1).padStart(4, '0');
        const internalId = `BILL-${new Date().getFullYear()}-${nextSeq}`;

        const newInvoice = {
            ...invoice,
            id: internalId,
            status: 'Posted',
            createdAt: new Date().toISOString()
        };
        setVendorInvoices(prev => [newInvoice, ...prev]);
        return newInvoice;
    };

    const updateInvoiceStatus = (id, status) => {
        setVendorInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    };

    return (
        <ProcurementContext.Provider value={{
            purchaseOrders,
            addPurchaseOrder,
            updatePurchaseOrder,
            deletePurchaseOrder,
            submitPO,
            approvePO,
            rejectPO,
            vendorInvoices,
            addVendorInvoice,
            updateInvoiceStatus
        }}>
            {children}
        </ProcurementContext.Provider>
    );
};
