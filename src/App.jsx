import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { CategoryProvider } from './context/CategoryContext';
import { AccountingProvider } from './context/AccountingContext';
import { HRProvider } from './context/HRContext';
import { ProcurementProvider } from './context/ProcurementContext';
import { PayrollProvider } from './context/PayrollContext';
import LandingPage from './pages/LandingPage';
import DesignSystemPage from './pages/DesignSystemPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AccountingDashboard from './pages/dashboard/accounting/AccountingDashboard';
import ChartOfAccounts from './pages/dashboard/accounting/ChartOfAccounts';
import JournalEntries from './pages/dashboard/accounting/JournalEntries';
import NewJournalEntry from './pages/dashboard/accounting/NewJournalEntry';
import GeneralLedger from './pages/dashboard/accounting/GeneralLedger';
import TrialBalance from './pages/dashboard/accounting/TrialBalance';
import Invoices from './pages/dashboard/accounting/Invoices';
// Duplicate removed
import CreateInvoice from './pages/dashboard/accounting/CreateInvoice';
import InvoicePreview from './pages/dashboard/accounting/InvoicePreview';
import VendorPaymentsList from './pages/dashboard/accounting/VendorPaymentsList';
import BankAccounts from './pages/dashboard/accounting/BankAccounts';
import AddBankAccount from './pages/dashboard/accounting/AddBankAccount';
import FixedAssets from './pages/dashboard/accounting/FixedAssets';
import RegisterAsset from './pages/dashboard/accounting/RegisterAsset';
import CostCenters from './pages/dashboard/accounting/CostCenters';
// Removed duplicate
import Customers from './pages/dashboard/accounting/Customers';
import AddCustomer from './pages/dashboard/accounting/AddCustomer';
import { AttendanceProvider } from './context/AttendanceContext';
import { InventoryProvider } from './context/InventoryContext';
import HRDashboard from './pages/dashboard/hr/HRDashboard';
import Organization from './pages/dashboard/hr/Organization';
import EmployeeDirectory from './pages/dashboard/hr/EmployeeDirectory';
import EmployeeDetails from './pages/dashboard/hr/EmployeeDetails';
import FinalSettlement from './pages/dashboard/hr/FinalSettlement';
import Payroll from './pages/dashboard/hr/Payroll';
import SalaryComponents from './pages/dashboard/hr/payroll/SalaryComponents';
import SalaryStructures from './pages/dashboard/hr/payroll/SalaryStructures';
import RunPayroll from './pages/dashboard/hr/payroll/RunPayroll';
import TaxSlabs from './pages/dashboard/hr/payroll/TaxSlabs';
import SocialSecuritySettings from './pages/dashboard/hr/payroll/SocialSecuritySettings';
import PeriodDetails from './pages/dashboard/hr/payroll/PeriodDetails';
import PayslipPDF from './pages/dashboard/hr/payroll/PayslipPDF';
// import AddEmployee from './pages/dashboard/hr/AddEmployee'; // Removed
import Attendance from './pages/dashboard/hr/Attendance';
import LeaveRequests from './pages/dashboard/hr/LeaveRequests';
import EmployeeRequests from './pages/dashboard/hr/EmployeeRequests';
import InventoryDashboard from './pages/dashboard/inventory/InventoryDashboard';
import ItemsList from './pages/dashboard/inventory/ItemsList';
import AddItem from './pages/dashboard/inventory/AddItem';

import PurchaseOrderList from './pages/dashboard/procurement/PurchaseOrderList';
import PurchaseOrderForm from './pages/dashboard/procurement/PurchaseOrderForm';
import VendorInvoiceList from './pages/dashboard/procurement/VendorInvoiceList';
import VendorInvoiceForm from './pages/dashboard/procurement/VendorInvoiceForm';
import Vendors from './pages/dashboard/inventory/Vendors';
import AddVendor from './pages/dashboard/inventory/AddVendor';
import Warehouses from './pages/dashboard/inventory/Warehouses';
import TransactionsList from './pages/dashboard/inventory/TransactionsList';
import GoodsReceipt from './pages/dashboard/inventory/GoodsReceipt';
import GoodsIssue from './pages/dashboard/inventory/GoodsIssue';
import WarehouseTransfer from './pages/dashboard/inventory/WarehouseTransfer';
import InventoryLayout from './pages/dashboard/inventory/InventoryLayout';
import Reports from './pages/dashboard/Reports';
import ProfitAndLoss from './pages/dashboard/reports/ProfitAndLoss';
import BalanceSheet from './pages/dashboard/reports/BalanceSheet';
import TaxReturn from './pages/dashboard/reports/TaxReturn';
import CashFlowStatement from './pages/dashboard/reports/CashFlowStatement';

import CategoryManagement from './pages/dashboard/CategoryManagement';

import EmployeeLayout from './components/layout/EmployeeLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyRequests from './pages/employee/MyRequests';
import Payslips from './pages/employee/Payslips';
import PayslipPreview from './pages/employee/PayslipPreview';
import Settings from './pages/dashboard/Settings';
import ComingSoon from './components/common/ComingSoon'; // Keeping for safety, but removing usages.

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CategoryProvider>
          <AccountingProvider>
            <HRProvider>
              <PayrollProvider>
                <InventoryProvider>
                  <AttendanceProvider>
                    <ProcurementProvider>
                      <BrowserRouter>
                        <Routes>
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/design" element={<DesignSystemPage />} />
                          <Route path="/auth/signin" element={<SignIn />} />
                          <Route path="/auth/signup" element={<SignUp />} />
                          <Route path="/onboarding" element={<OnboardingWizard />} />

                          <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />

                            <Route path="accounting">
                              <Route index element={<AccountingDashboard />} />
                              <Route path="coa" element={<ChartOfAccounts />} />
                              <Route path="journal" element={<JournalEntries />} />
                              <Route path="journal/new" element={<NewJournalEntry />} />
                              <Route path="journal/:id" element={<NewJournalEntry />} />
                              <Route path="gl" element={<GeneralLedger />} />
                              <Route path="trial-balance" element={<TrialBalance />} />
                              <Route path="invoices" element={<Invoices />} />
                              {/* Duplicate removed */}
                              <Route path="invoices/new" element={<CreateInvoice />} />
                              <Route path="invoices/:id" element={<InvoicePreview />} />
                              <Route path="bank" element={<BankAccounts />} />
                              <Route path="bank/new" element={<AddBankAccount />} />
                              <Route path="assets" element={<FixedAssets />} />
                              <Route path="assets/new" element={<RegisterAsset />} />
                              <Route path="cost-centers" element={<CostCenters />} />
                              <Route path="customers" element={<Customers />} />
                              <Route path="customers/new" element={<AddCustomer />} />
                              <Route path="vendor-payments" element={<VendorPaymentsList />} />
                            </Route>

                            <Route path="hr">
                              <Route index element={<HRDashboard />} />
                              <Route path="organization" element={<Organization />} />
                              <Route path="employees" element={<EmployeeDirectory />} />
                              <Route path="employees/:id" element={<EmployeeDetails />} />
                              <Route path="employees/new" element={<EmployeeDetails />} />
                              <Route path="final-settlement" element={<FinalSettlement />} />
                              <Route path="payroll" element={<Payroll />} />
                              <Route path="payroll/components" element={<SalaryComponents />} />
                              <Route path="payroll/structures" element={<SalaryStructures />} />
                              <Route path="payroll/run" element={<RunPayroll />} />
                              <Route path="payroll/tax-slabs" element={<TaxSlabs />} />
                              <Route path="payroll/social-security" element={<SocialSecuritySettings />} />
                              <Route path="payroll/period/:id" element={<PeriodDetails />} />
                              <Route path="payroll/payslip/:id" element={<PayslipPDF />} />
                              {/* Duplicate removed */}
                              <Route path="attendance" element={<Attendance />} />
                              <Route path="attendance/requests" element={<LeaveRequests />} />
                              <Route path="requests" element={<EmployeeRequests />} />
                            </Route>


                            <Route path="inventory" element={<InventoryLayout />}>
                              <Route index element={<Navigate to="dashboard" replace />} />
                              <Route path="dashboard" element={<InventoryDashboard />} />
                              <Route path="items" element={<ItemsList />} />
                              <Route path="items/new" element={<AddItem />} />

                              {/* Procurement Modules */}
                              <Route path="purchase-orders" element={<PurchaseOrderList />} />
                              <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
                              <Route path="purchase-orders/:id" element={<PurchaseOrderForm />} />

                              <Route path="invoices" element={<VendorInvoiceList />} />
                              <Route path="invoices/new" element={<VendorInvoiceForm />} />

                              <Route path="vendors" element={<Vendors />} />
                              <Route path="vendors/new" element={<AddVendor />} />
                              <Route path="warehouses" element={<Warehouses />} />
                              <Route path="transactions" element={<TransactionsList />} />
                              <Route path="transactions/receipt" element={<GoodsReceipt />} />
                              <Route path="transactions/issue" element={<GoodsIssue />} />
                              <Route path="transactions/transfer" element={<WarehouseTransfer />} />
                            </Route>

                            <Route path="reports">
                              <Route index element={<Reports />} />
                              <Route path="pnl" element={<ProfitAndLoss />} />
                              <Route path="balance-sheet" element={<BalanceSheet />} />
                              <Route path="tax-return" element={<TaxReturn />} />
                              <Route path="cash-flow" element={<CashFlowStatement />} />
                            </Route>
                            <Route path="settings" element={<Settings />} />
                            <Route path="categories" element={<CategoryManagement />} />
                          </Route>

                          <Route path="/employee" element={<EmployeeLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<EmployeeDashboard />} />
                            <Route path="requests" element={<MyRequests />} />
                            <Route path="payslips" element={<Payslips />} />
                            <Route path="payslips/:id" element={<PayslipPreview />} />
                          </Route>

                          {/* Catch-all */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </BrowserRouter>
                    </ProcurementProvider>
                  </AttendanceProvider>
                </InventoryProvider>
              </PayrollProvider>
            </HRProvider>
          </AccountingProvider>
        </CategoryProvider>
      </LanguageProvider>
    </ThemeProvider >
  );
}

export default App;
