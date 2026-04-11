// v2.8.0 - 2026-03-08
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { CategoryProvider } from './context/CategoryContext';
import { AccountingProvider } from './context/AccountingContext';
import { HRProvider } from './context/HRContext';
import { ProcurementProvider } from './context/ProcurementContext';
import { PayrollProvider } from './context/PayrollContext';
import { AuthProvider } from './context/AuthContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { AuditProvider } from './context/AuditContext';
import { NotificationsProvider } from './context/NotificationsContext';
import LandingPage from './pages/LandingPage';
import DesignSystemPage from './pages/DesignSystemPage';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import AccountingDashboard from './components/Accounting/AccountingDashboard';
import ChartOfAccounts from './components/Accounting/ChartOfAccounts';
import JournalEntries from './components/Accounting/JournalEntries';
import NewJournalEntry from './components/Accounting/NewJournalEntry';
import GeneralLedger from './components/Accounting/GeneralLedger';
import TrialBalance from './components/Accounting/TrialBalance';
import Invoices from './components/Accounting/Invoices';
import CreateInvoice from './components/Accounting/CreateInvoice';
import InvoicePreview from './components/Accounting/InvoicePreview';
import VendorPaymentsList from './components/Accounting/VendorPaymentsList';
import ProductsServices from './components/Accounting/ProductsServices';
import BankAccounts from './components/Accounting/BankAccounts';
import AddBankAccount from './components/Accounting/AddBankAccount';
import FixedAssets from './components/Accounting/FixedAssets';
import RegisterAsset from './components/Accounting/RegisterAsset';
import CostCenters from './components/Accounting/CostCenters';
import BankStatementImport from './components/Accounting/BankStatementImport';
import Customers from './components/Accounting/Customers';
import AddCustomer from './components/Accounting/AddCustomer';
import { AttendanceProvider } from './context/AttendanceContext';
import { InventoryProvider } from './context/InventoryContext';
import HRDashboard from './components/HR/HRDashboard';
import Organization from './components/HR/Organization';
import EmployeeDirectory from './components/HR/EmployeeDirectory';
import EmployeeDetails from './components/HR/EmployeeDetails';
import FinalSettlement from './components/HR/FinalSettlement';
import Payroll from './components/HR/Payroll';
import SalaryComponents from './components/HR/payroll/SalaryComponents';
import SalaryStructures from './components/HR/payroll/SalaryStructures';
import RunPayroll from './components/HR/payroll/RunPayroll';
import TaxSlabs from './components/HR/payroll/TaxSlabs';
import SocialSecuritySettings from './components/HR/payroll/SocialSecuritySettings';
import PeriodDetails from './components/HR/payroll/PeriodDetails';
import PayslipPDF from './components/HR/payroll/PayslipPDF';
import Attendance from './components/HR/Attendance';
import LeaveRequests from './components/HR/LeaveRequests';
import EmployeeRequests from './components/HR/EmployeeRequests';
import ProjectsManagement from './components/HR/ProjectsManagement';
import ContractTemplates from './components/HR/ContractTemplates';
import InventoryDashboard from './components/Inventory/InventoryDashboard';
import ItemsList from './components/Inventory/ItemsList';
import AddItem from './components/Inventory/AddItem';
import PurchaseOrderList from './components/Procurement/PurchaseOrderList';
import PurchaseOrderForm from './components/Procurement/PurchaseOrderForm';
import VendorInvoiceList from './components/Procurement/VendorInvoiceList';
import VendorInvoiceForm from './components/Procurement/VendorInvoiceForm';
import Vendors from './components/Inventory/Vendors';
import AddVendor from './components/Inventory/AddVendor';
import Warehouses from './components/Inventory/Warehouses';
import TransactionsList from './components/Inventory/TransactionsList';
import GoodsReceipt from './components/Inventory/GoodsReceipt';
import GoodsIssue from './components/Inventory/GoodsIssue';
import WarehouseTransfer from './components/Inventory/WarehouseTransfer';
import InventoryLayout from './components/Inventory/InventoryLayout';
import Reports from './components/Reports/Reports';
import ProfitAndLoss from './components/Reports/ProfitAndLoss';
import BalanceSheet from './components/Reports/BalanceSheet';
import TaxReturn from './components/Reports/TaxReturn';
import CashFlowStatement from './components/Reports/CashFlowStatement';
import CategoryManagement from './components/CategoryManagement/CategoryManagement';
import EmployeeLayout from './components/layout/EmployeeLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyRequests from './pages/employee/MyRequests';
import Payslips from './pages/employee/Payslips';
import PayslipPreview from './pages/employee/PayslipPreview';
import MyContract from './pages/employee/MyContract';
import Settings from './components/Settings/Settings';
import ComingSoon from './components/Shared/ComingSoon';
import PermissionsManagement from './components/PermissionsManagement';
import AuditorLogin from './pages/auditor/AuditorLogin';
import AuditorDashboard from './pages/auditor/AuditorDashboard';
import AuditManagement from './components/Accounting/AuditManagement';
import AuditorAdjustmentsPage from './components/AuditorAdjustmentsPage';
import NotificationsPage from './components/NotificationsPage';

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ThemeProvider>
          <LanguageProvider>
            <CategoryProvider>
              <AccountingProvider>
                <AuditProvider>
                  <HRProvider>
                    <PermissionsProvider>
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

                                  {/* Auditor Routes */}
                                  <Route path="/auditor/login" element={<AuditorLogin />} />
                                  <Route path="/auditor/dashboard" element={<AuditorDashboard />} />

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
                                      <Route path="products-services" element={<ProductsServices />} />
                                      <Route path="bank-import" element={<BankStatementImport />} />
                                      <Route path="audit" element={<AuditManagement />} />
                                      <Route path="auditor-adjustments" element={<AuditorAdjustmentsPage />} />
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
                                      <Route path="projects" element={<ProjectsManagement />} />
                                      <Route path="contract-templates" element={<ContractTemplates />} />
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
                                    <Route path="permissions" element={<PermissionsManagement />} />
                                    <Route path="categories" element={<CategoryManagement />} />
                                    <Route path="notifications" element={<NotificationsPage />} />
                                  </Route>

                                  <Route path="/employee" element={<EmployeeLayout />}>
                                    <Route index element={<Navigate to="dashboard" replace />} />
                                    <Route path="dashboard" element={<EmployeeDashboard />} />
                                    <Route path="requests" element={<MyRequests />} />
                                    <Route path="payslips" element={<Payslips />} />
                                    <Route path="payslips/:id" element={<PayslipPreview />} />
                                    <Route path="my-contract" element={<MyContract />} />
                                  </Route>

                                  {/* Catch-all */}
                                  <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                              </BrowserRouter>
                            </ProcurementProvider>
                          </AttendanceProvider>
                        </InventoryProvider>
                      </PayrollProvider>
                    </PermissionsProvider>
                  </HRProvider>
                </AuditProvider>
              </AccountingProvider>
            </CategoryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
