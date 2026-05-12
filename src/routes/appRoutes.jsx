import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import DesignSystemPage from "@/pages/DesignSystemPage";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import OnboardingWizard from "@/pages/onboarding/OnboardingWizard";
import AdminLayout from "@/components/app-layout/AdminLayout";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";
import AccountingDashboard from "@/components/Accounting/AccountingDashboard";
import ChartOfAccounts from "@/components/Accounting/ChartOfAccounts/index.jsx";
import JournalEntries from "@/components/Accounting/JournalEntries";
import NewJournalEntry from "@/components/Accounting/NewJournalEntry";
import GeneralLedger from "@/components/Accounting/GeneralLedger";
import TrialBalance from "@/components/Accounting/TrialBalance";
import Invoices from "@/components/Accounting/Invoices";
import CreateInvoice from "@/components/Accounting/CreateInvoice";
import InvoicePreview from "@/components/Accounting/InvoicePreview";
import VendorPaymentsList from "@/components/Accounting/VendorPaymentsList";
import ProductsServices from "@/components/Accounting/ProductsServices";
import BankAccounts from "@/components/Accounting/BankAccounts";
import AddBankAccount from "@/components/Accounting/AddBankAccount";
import FixedAssets from "@/components/Accounting/FixedAssets";
import RegisterAsset from "@/components/Accounting/RegisterAsset";
import CostCenters from "@/components/Accounting/CostCenters";
import BankStatementImport from "@/components/Accounting/BankStatementImport";
import Customers from "@/components/Accounting/Customers";
import AddCustomer from "@/components/Accounting/AddCustomer";
import HRDashboard from "@/components/hr/HRDashboard";
import Organization from "@/components/hr/Organization";
import EmployeeDirectory from "@/components/hr/EmployeeDirectory";
import EmployeeDetails from "@/components/hr/EmployeeDetails";
import FinalSettlement from "@/components/hr/FinalSettlement";
import Payroll from "@/components/hr/Payroll";
import SalaryComponents from "@/components/hr/payroll/SalaryComponents";
import SalaryStructures from "@/components/hr/payroll/SalaryStructures";
import RunPayroll from "@/components/hr/payroll/RunPayroll";
import RunPayrollWorkflow from "@/components/hr/payroll/RunPayrollWorkflow";
import TaxSlabs from "@/components/hr/payroll/TaxSlabs/index.jsx";
import SocialSecuritySettings from "@/components/hr/payroll/SocialSecuritySettings";
import PeriodDetails from "@/components/hr/payroll/PeriodDetails";
import FinalizePayrollPage from "@/components/hr/payroll/FinalizePayrollPage";
import PayslipPDF from "@/components/hr/payroll/PayslipPDF";
import Attendance from "@/components/hr/Attendance";
import LeaveRequests from "@/components/hr/LeaveRequests";
import EmployeeRequests from "@/components/hr/EmployeeRequests";
import ProjectsManagement from "@/components/hr/ProjectsManagement";
import ContractTemplates from "@/components/hr/ContractTemplates/index.jsx";
import InventoryDashboard from "@/components/Inventory/InventoryDashboard";
import ItemsList from "@/components/Inventory/ItemsList";
import AddInventoryItem from "@/components/Inventory/AddInventoryItem";
import EditInventoryItem from "@/components/Inventory/EditInventoryItem";
import PurchaseOrderList from "@/components/Procurement/PurchaseOrderList";
import PurchaseOrderForm from "@/components/Procurement/PurchaseOrderForm";
import PurchaseOrderEdit from "@/components/Procurement/PurchaseOrderEdit";
import VendorInvoiceList from "@/components/Procurement/VendorInvoiceList";
import VendorInvoiceForm from "@/components/Procurement/VendorInvoiceForm";
import Vendors from "@/components/Inventory/Vendors";
import AddVendor from "@/components/Inventory/AddVendor";
import Warehouses from "@/components/Inventory/Warehouses";
import TransactionsList from "@/components/Inventory/TransactionsList";
import GoodsReceipt from "@/components/Inventory/GoodsReceipt";
import GoodsIssue from "@/components/Inventory/GoodsIssue";
import WarehouseTransfer from "@/components/Inventory/WarehouseTransfer";
import InventoryLayout from "@/components/Inventory/InventoryLayout";
import Reports from "@/components/Reports/Reports";
import ProfitAndLoss from "@/components/Reports/ProfitAndLoss";
import BalanceSheet from "@/components/Reports/BalanceSheet";
import TaxReturn from "@/components/Reports/TaxReturn";
import CashFlowStatement from "@/components/Reports/CashFlowStatement";
import CategoryManagement from "@/components/CategoryManagement/CategoryManagement";
import EmployeeLayout from "@/components/app-layout/EmployeeLayout";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import FirstLoginResetPassword from "@/pages/employee/FirstLoginResetPassword";
import MyRequests from "@/pages/employee/MyRequests";
import Payslips from "@/pages/employee/Payslips";
import PayslipPreview from "@/pages/employee/PayslipPreview";
import MyContract from "@/pages/employee/MyContract";
import Settings from "@/components/Settings/Settings";
import PermissionsManagement from "@/components/PermissionsManagement";
import AuditorLogin from "@/pages/auditor/AuditorLogin";
import AuditorDashboard from "@/pages/auditor/AuditorDashboard";
import AuditManagement from "@/components/Accounting/AuditManagement";
import AuditFirmDetails from "@/components/Accounting/AuditFirmDetails";
import AccountantPaymentsPage from "@/components/Accounting/AccountantPayments/AccountantPaymentsPage";
import PayrollPeriodPayablesPage from "@/components/Accounting/AccountantPayments/PayrollPeriodPayablesPage";
import AuditorAdjustmentsPage from "@/components/AuditorAdjustmentsPage";
import NotificationsPage from "@/components/NotificationsPage";
import { useAuth } from "@/context/AuthContext";

const getDashboardPath = (user) => {
  if (user?.role === "employee") return "/employee/dashboard";
  if (user?.role === "auditor") return "/auditor/dashboard";
  return "/admin/dashboard";
};

const getEmployeeLandingPath = (user) =>
  user?.reset_password_required
    ? "/employee/reset-password-first-login"
    : "/employee/dashboard";

const PublicOnlyRoute = ({ children, isAuthenticated, user }) => {
  if (isAuthenticated) {
    if (user?.role === "employee") {
      return <Navigate to={getEmployeeLandingPath(user)} replace />;
    }
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
};

const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  return children;
};

const ProtectedEmployeeRoute = ({ children, isAuthenticated, user }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (user?.role !== "employee") {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  if (user?.reset_password_required) {
    return <Navigate to="/employee/reset-password-first-login" replace />;
  }

  return children;
};

const FirstLoginResetPasswordRoute = ({ isAuthenticated, user }) => {
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (user?.role !== "employee") {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  if (!user?.reset_password_required) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <FirstLoginResetPassword />;
};

export default function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute isAuthenticated={isAuthenticated} user={user}>
            <LandingPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/design" element={<DesignSystemPage />} />
      <Route
        path="/auth/signin"
        element={
          <PublicOnlyRoute isAuthenticated={isAuthenticated} user={user}>
            <SignIn />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth/signin/:company"
        element={
          <PublicOnlyRoute isAuthenticated={isAuthenticated} user={user}>
            <SignIn />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth/signup"
        element={
          <PublicOnlyRoute isAuthenticated={isAuthenticated} user={user}>
            <SignUp />
          </PublicOnlyRoute>
        }
      />
      <Route path="/onboarding" element={<OnboardingWizard />} />

      <Route path="/auditor/login" element={<AuditorLogin />} />
      <Route path="/auditor/dashboard" element={<AuditorDashboard />} />

      <Route
        path="/employee/reset-password-first-login"
        element={
          <FirstLoginResetPasswordRoute
            isAuthenticated={isAuthenticated}
            user={user}
          />
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
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
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="invoices/:id/edit" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<InvoicePreview />} />
          <Route path="bank" element={<BankAccounts />} />
          <Route path="bank/new" element={<AddBankAccount />} />
          <Route path="assets" element={<FixedAssets />} />
          <Route path="assets/new" element={<RegisterAsset />} />
          {/* TODO: Delete Cost Centers */}
          {/* <Route path="cost-centers" element={<CostCenters />} /> */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/new" element={<AddCustomer />} />
          <Route path="vendor-payments" element={<VendorPaymentsList />} />
          <Route path="products-services" element={<ProductsServices />} />
          <Route path="bank-import" element={<BankStatementImport />} />
          <Route path="audit" element={<AuditManagement />} />
          <Route path="audit/firms/:id" element={<AuditFirmDetails />} />
          <Route path="accountant-payments" element={<AccountantPaymentsPage />} />
          <Route
            path="accountant-payments/payroll/:periodId"
            element={<PayrollPeriodPayablesPage />}
          />
        </Route>

        <Route
          path="auditor-adjustments"
          element={<AuditorAdjustmentsPage />}
        />

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
          <Route path="payroll/run/workflow" element={<RunPayrollWorkflow />} />
          <Route path="payroll/tax-slabs" element={<TaxSlabs />} />
          <Route
            path="payroll/social-security"
            element={<SocialSecuritySettings />}
          />
          <Route
            path="payroll/period/:id/finalize"
            element={<FinalizePayrollPage />}
          />
          <Route path="payroll/period/:id" element={<PeriodDetails />} />
          <Route path="payroll/payslip/:id" element={<PayslipPDF />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/requests" element={<LeaveRequests />} />
          <Route path="requests" element={<EmployeeRequests />} />
          <Route path="projects" element={<ProjectsManagement />} />
          <Route path="contract-templates" element={<ContractTemplates />} />
          <Route
            path="contract-templates/new"
            element={<ContractTemplates />}
          />
          <Route
            path="contract-templates/:templateId/edit"
            element={<ContractTemplates />}
          />
          <Route
            path="contract-templates/:templateId/preview"
            element={<ContractTemplates />}
          />
        </Route>

        <Route path="inventory" element={<InventoryLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InventoryDashboard />} />
          <Route path="items" element={<ItemsList />} />
          <Route path="items/new" element={<AddInventoryItem />} />
          <Route path="items/:id/edit" element={<EditInventoryItem />} />
          <Route path="purchase-orders" element={<PurchaseOrderList />} />
          <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
          <Route
            path="purchase-orders/:id/edit"
            element={<PurchaseOrderEdit />}
          />
          <Route path="purchase-orders/:id" element={<PurchaseOrderForm />} />
          <Route path="invoices" element={<VendorInvoiceList />} />
          <Route path="invoices/new" element={<VendorInvoiceForm />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="vendors/new" element={<AddVendor />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="transactions" element={<TransactionsList />} />
          <Route path="transactions/receipt" element={<GoodsReceipt />} />
          {/* TODO: Confirm Deletion of this route and it's corresponding component */}
          {/* <Route path="transactions/issue" element={<GoodsIssue />} /> */}
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

      <Route
        path="/employee"
        element={
          <ProtectedEmployeeRoute isAuthenticated={isAuthenticated} user={user}>
            <EmployeeLayout />
          </ProtectedEmployeeRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="payslips" element={<Payslips />} />
        <Route path="payslips/:id" element={<PayslipPreview />} />
        <Route path="my-contract" element={<MyContract />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
