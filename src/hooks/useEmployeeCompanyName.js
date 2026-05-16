import useCustomQuery from "@/hooks/useQuery";
import { useCompanyName } from "@/hooks/useCompanyName";

const EMPLOYEE_DASHBOARD_URL = "/api/hr/employees/dashboard/";
const EMPLOYEE_DASHBOARD_QUERY_KEY = ["hr-employee-dashboard"];

/**
 * Company display name for employee portal: prefers dashboard API
 * `company_name`, then persisted auth user, then product default.
 */
export function useEmployeeCompanyName() {
  const fallback = useCompanyName();
  const { data } = useCustomQuery(
    EMPLOYEE_DASHBOARD_URL,
    EMPLOYEE_DASHBOARD_QUERY_KEY,
    { staleTime: 5 * 60 * 1000 },
  );
  const fromDashboard = String(data?.company_name ?? "").trim();
  return fromDashboard || fallback;
}
