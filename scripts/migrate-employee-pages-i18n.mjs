import fs from 'fs';

function migrateFile(path, isMyRequests = false) {
  let s = fs.readFileSync(path, 'utf8');
  if (!s.includes('useTranslation')) {
    s = s.replace(
      /^(import React[^\n]+\n)/,
      "$1import { useTranslation } from 'react-i18next';\nimport { translateApiError } from '@/utils/translateApiError';\n",
    );
  }

  if (!s.includes('const { t }')) {
    s = s.replace(
      /const (EmployeeDashboard|MyRequests) = \(\) => \{/,
      "const $1 = () => {\n  const { t } = useTranslation(['employee', 'common']);",
    );
  }

  s = s.replace(/function formatTrackerMutationError[\s\S]*?\n\}\n\n/, '');

  const shared = [
    ['toast.success("Document uploaded.")', "toast.success(t('employee:toast.documentUploaded'))"],
    ['toast.success("Leave request submitted.")', "toast.success(t('employee:toast.leaveSubmitted'))"],
    ['? "Document upload failed"', "? t('employee:toast.documentUploadFailed')"],
    [': "Leave request failed"', ": t('employee:toast.leaveRequestFailed')"],
    ['? "Could not upload document."', "? t('employee:toast.uploadDocumentFailed')"],
    [': "Could not submit leave request."', ": t('employee:toast.submitLeaveFailed')"],
    ['requestKind === "document" ? "Upload Document" : "Request Leave"', "requestKind === 'document' ? t('employee:requestForm.uploadDocument') : t('employee:requestForm.requestLeave')"],
    ['>Request</label>', ">{t('employee:requestForm.request')}</label>"],
    ['<option value="leave">Leave</option>', '<option value="leave">{t(\'employee:requestForm.leave\')}</option>'],
    ['<option value="document">Document</option>', '<option value="document">{t(\'employee:requestForm.document\')}</option>'],
    ['label="Name"', 'label={t(\'employee:requestForm.name\')}'],
    ['placeholder="Salary certificate"', "placeholder={t('employee:requestForm.namePlaceholder')}"],
    ['required: "Document name is required."', "required: t('employee:requestForm.validation.documentNameRequired')"],
    ['>File</label>', ">{t('employee:requestForm.file')}</label>"],
    ['? "File selected"', "? t('employee:requestForm.fileSelected')"],
    [': "Choose a file"', ": t('employee:requestForm.chooseFile')"],
    ['"PDF, PNG, JPG (max size depends on server)"', "t('employee:requestForm.fileHint')"],
    ['>Remove</button>', ">{t('employee:requestForm.remove')}</button>"],
    ['>Browse</span>', ">{t('employee:requestForm.browse')}</span>"],
    ['required: "File is required."', "required: t('employee:requestForm.validation.fileRequired')"],
    ['>Leave Type</label>', ">{t('employee:requestForm.leaveType')}</label>"],
    ['required: "Leave type is required."', "required: t('employee:requestForm.validation.leaveTypeRequired')"],
    ['<option value="annual">Annual Leave</option>', '<option value="annual">{t(\'employee:requestForm.annualLeave\')}</option>'],
    ['<option value="sick">Sick Leave</option>', '<option value="sick">{t(\'employee:requestForm.sickLeave\')}</option>'],
    ['label="From Date"', 'label={t(\'employee:requestForm.fromDate\')}'],
    ['required: "Start date is required."', "required: t('employee:requestForm.validation.startDateRequired')"],
    ['label="To Date"', 'label={t(\'employee:requestForm.toDate\')}'],
    ['required: "End date is required."', "required: t('employee:requestForm.validation.endDateRequired')"],
    ['"End date must be after start date."', "t('employee:requestForm.validation.endDateAfterStart')"],
    ['label="Days"', 'label={t(\'employee:requestForm.days\')}'],
    ['label="Notes"', 'label={t(\'employee:requestForm.notes\')}'],
    ['placeholder="Family travel"', "placeholder={t('employee:requestForm.notesPlaceholder')}"],
    ['>Cancel</Button>', ">{t('common:actions.cancel')}</Button>"],
    ['? "Submitting…"', "? t('employee:requestForm.submitting')"],
    ['? "Upload Document"', "? t('employee:requestForm.uploadDocument')"],
    [': "Submit Leave"', ": t('employee:requestForm.submitLeave')"],
  ];

  const dashboardOnly = [
    ['const greetingName = dashboardData?.user?.full_name || "Employee";', "const greetingName = dashboardData?.user?.full_name || t('employee:employee');"],
    ['toast.success("Time tracker started.")', "toast.success(t('employee:toast.timeTrackerStarted'))"],
    ['toast.error("Could not start time tracker.", {', "toast.error(t('employee:toast.timeTrackerStartFailed'), {"],
    ['description: formatTrackerMutationError(error),', 'description: translateApiError(error),'],
    ['toast.success("Time tracker stopped.")', "toast.success(t('employee:toast.timeTrackerStopped'))"],
    ['toast.error("Could not stop time tracker.", {', "toast.error(t('employee:toast.timeTrackerStopFailed'), {"],
    ['label: p.name || "Untitled project"', "label: p.name || t('employee:dashboard.untitledProject')"],
    ['title="Could not load employee dashboard"', "title={t('employee:dashboard.loadError')}"],
    ['refreshLabel="Try again"', "refreshLabel={t('common:actions.retry')}"],
    ['{`Good Morning, ${greetingName}`}', "{t('employee:dashboard.greeting', { name: greetingName })}"],
    ['pendingRequestsCount === 1 ? "" : "s"', "pendingRequestsCount === 1 ? '_one' : '_other'"],
    ['`You currently have ${pendingRequestsCount} pending request${pendingRequestsCount === 1 ? "" : "s"}.`',
      "t(`employee:dashboard.pendingRequests${pendingRequestsCount === 1 ? '_one' : '_other'}`, { count: pendingRequestsCount })"],
    ['>New Request</Button>', ">{t('employee:dashboard.newRequest')}</Button>"],
    ['<NoData label="dashboard" />', "<NoData label={t('employee:empty.dashboard')} />"],
    ['>Time Tracker</h3>', ">{t('employee:dashboard.timeTracker')}</h3>"],
    ['stopTimeTrackerMutation.isPending ? "Stopping…" : "Stop"', "stopTimeTrackerMutation.isPending ? t('employee:dashboard.stopping') : t('employee:dashboard.stop')"],
    ['Started at{" "}', "{t('employee:dashboard.startedAt', { time: '' }).replace(' {{time}}', '')}{' '}"],
    ['label="Project"', 'label={t(\'employee:dashboard.project\')}'],
    ['emptyOptionLabel="Select project…"', "emptyOptionLabel={t('employee:dashboard.selectProject')}"],
    ['? "Could not load projects. Scroll to retry or refresh the page."', "? t('employee:dashboard.projectsLoadError')"],
    ['>What are you working on?</label>', ">{t('employee:dashboard.whatWorkingOn')}</label>"],
    ['placeholder="e.g. Working on payroll module"', "placeholder={t('employee:dashboard.workOnPlaceholder')}"],
    ['startTimeTrackerMutation.isPending ? "Starting…" : "Start"', "startTimeTrackerMutation.isPending ? t('employee:dashboard.starting') : t('employee:dashboard.start')"],
    ["Today&apos;s activity", "{t('employee:dashboard.todaysActivity')}"],
    ["Loading today&apos;s log…", "{t('employee:dashboard.loadingTodayLog')}"],
    ["Could not load today&apos;s time entries.", "{t('employee:dashboard.todayEntriesError')}"],
    ['>Retry</button>', ">{t('common:actions.retry')}</button>"],
    ['No completed entries today yet.', "{t('employee:dashboard.noCompletedToday')}"],
    ['>Leave Balance</h3>', ">{t('employee:dashboard.leaveBalance')}</h3>"],
    ['>Annual Leave</span>', ">{t('employee:dashboard.annualLeave')}</span>"],
    ['{`${remainingBalance} / ${annualEntitlement} Days`}', "{t('employee:dashboard.daysCount', { remaining: remainingBalance, total: annualEntitlement })}"],
    ['>Payslips</h3>', ">{t('employee:dashboard.payslipsCard')}</h3>"],
    ['latestPayslip.period_name || "Period"', "latestPayslip.period_name || t('employee:dashboard.period')"],
    ['`Last payment on ${formatDate(latestPayslip.pay_date) || "-"} (${latestPayslip.period_name || "Period"})`',
      "t('employee:dashboard.lastPayment', { date: formatDate(latestPayslip.pay_date) || '-', period: latestPayslip.period_name || t('employee:dashboard.period') })"],
    ['label="payslip"', "label={t('employee:empty.payslip')}"],
    ['toast.info("Payslip download is not connected yet.")', "toast.info(t('employee:dashboard.payslipDownloadUnavailable'))"],
    ['>Download PDF</Button>', ">{t('employee:dashboard.downloadPdf')}</Button>"],
    ['>Upcoming Holidays</h3>', ">{t('employee:dashboard.upcomingHolidays')}</h3>"],
    ['label="upcoming holidays"', "label={t('employee:empty.upcomingHolidays')}"],
    ['holiday.name || "Holiday"', "holiday.name || t('employee:dashboard.holiday')"],
    ['>My Projects</h3>', ">{t('employee:dashboard.myProjects')}</h3>"],
    ['<NoData label="projects" />', "<NoData label={t('employee:empty.projects')} />"],
    ['p.client_name || p.client || "Internal"', "p.client_name || p.client || t('employee:dashboard.internal')"],
    ['` • ${p.assignedEmployees.length} members`', "{t('employee:dashboard.members', { count: p.assignedEmployees.length }).replace(/^/, ' • ')}"],
    ['>My Requests</h3>', ">{t('employee:dashboard.myRequests')}</h3>"],
    ['<NoData label="requests" />', "<NoData label={t('employee:empty.requests')} />"],
    ['>Type</th>', ">{t('employee:dashboard.tableType')}</th>"],
    ['>Dates</th>', ">{t('employee:dashboard.tableDates')}</th>"],
    ['>Days</th>', ">{t('employee:dashboard.tableDays')}</th>"],
    ['>Status</th>', ">{t('employee:dashboard.tableStatus')}</th>"],
  ];

  const myRequestsOnly = [
    ['const requestTypeLabel = (type) => {', 'const requestTypeLabel = (type, t) => {'],
    ['if (t === "leave") return "Leave";', 'if (t === "leave") return tr("employee:myRequests.typeLeave");'],
    ['if (t === "document") return "Document";', 'if (t === "document") return tr("employee:myRequests.typeDocument");'],
    ['if (!type) return "Request";', 'if (!type) return tr("employee:myRequests.typeRequest");'],
    ['title="My requests could not be loaded"', "title={t('employee:myRequests.loadError')}"],
    ['>My Requests</h1>', ">{t('employee:myRequests.title')}</h1>"],
    ['Track and manage your HR requests.', "{t('employee:myRequests.subtitle')}"],
    ['>Updating…</div>', ">{t('employee:myRequests.updating')}</div>"],
    ['>Date Requested</th>', ">{t('employee:myRequests.tableDateRequested')}</th>"],
    ['>Details/Dates</th>', ">{t('employee:myRequests.tableDetails')}</th>"],
    ['>Actions</th>', ">{t('employee:myRequests.tableActions')}</th>"],
    ['requestTypeLabel(', 'requestTypeLabel('],
    ['toast.error("Document is not available.")', "toast.error(t('employee:myRequests.documentUnavailable'))"],
    ['toast.success("Request removed.")', "toast.success(t('employee:myRequests.requestRemoved'))"],
    ['e?.response?.data?.detail || e?.message || "Could not remove request."', "translateApiError(e, 'employee:myRequests.removeFailed')"],
    ['const kind = requestTypeLabel(deleteConfirmRequest.request_type);', 'const kind = requestTypeLabel(deleteConfirmRequest.request_type, t);'],
    ['return `Remove this pending ${kind} request?${snippet}\\n\\nThis action cannot be undone.`;',
      "return t('employee:myRequests.removeRequestConfirm', { kind, snippet });"],
    ['title="Remove request"', "title={t('employee:myRequests.removeRequestTitle')}"],
    ['deleteRequestMutation.isPending ? "Removing…" : "Delete"', "deleteRequestMutation.isPending ? t('employee:myRequests.removing') : t('common:actions.delete')"],
    ['>Document</h3>', ">{t('employee:myRequests.document')}</h3>"],
    ['>Download</Button>', ">{t('common:actions.download')}</Button>"],
    ['aria-label="Close"', 'aria-label={t(\'common:actions.close\')}'],
    ['title="Document preview"', "title={t('employee:myRequests.documentPreview')}"],
    ['No document file is linked to this request yet.', "{t('employee:myRequests.noDocumentLinked')}"],
    ['>View</Button>', ">{t('common:actions.view')}</Button>"],
    ['>Delete</Button>', ">{t('common:actions.delete')}</Button>"],
    ['This leave request was approved. No further action is required.', "{t('employee:myRequests.leaveApprovedHint')}"],
    ['This leave request was rejected. Contact HR if you need clarification.', "{t('employee:myRequests.leaveRejectedHint')}"],
    ['const typeLabel = requestTypeLabel(', 'const typeLabel = requestTypeLabel('],
  ];

  // Fix requestTypeLabel properly
  if (isMyRequests) {
    s = s.replace(
      `const requestTypeLabel = (type) => {
  if (!type) return "Request";
  const t = String(type).toLowerCase();
  if (t === "leave") return "Leave";
  if (t === "document") return "Document";
  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
};`,
      `const requestTypeLabel = (type, tr) => {
  if (!type) return tr('employee:myRequests.typeRequest');
  const key = String(type).toLowerCase();
  if (key === 'leave') return tr('employee:myRequests.typeLeave');
  if (key === 'document') return tr('employee:myRequests.typeDocument');
  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
};`,
    );
    s = s.replace(/requestTypeLabel\(([^,)]+)\)/g, 'requestTypeLabel($1, t)');
  }

  const reps = [...shared, ...(isMyRequests ? [] : dashboardOnly)];
  if (isMyRequests) {
    // apply myRequests specific after requestTypeLabel fix
    for (const [a, b] of myRequestsOnly.filter(([a]) => !a.includes('requestTypeLabel ='))) {
      if (s.includes(a)) s = s.split(a).join(b);
      else if (a.length > 20) console.log(path, 'miss', a.slice(0, 50));
    }
  }

  for (const [a, b] of reps) {
    if (s.includes(a)) s = s.split(a).join(b);
    else if (a.length > 25) console.log(path, 'miss', a.slice(0, 55));
  }

  // Fix started at line manually
  s = s.replace(
    "{t('employee:dashboard.startedAt', { time: '' }).replace(' {{time}}', '')}{' '}",
    "{t('employee:dashboard.startedAt', { time: formatDateTimeSimple(activeActivity.startTime) || '—' })}",
  );

  fs.writeFileSync(path, s);
  console.log('migrated', path);
}

migrateFile('src/pages/employee/EmployeeDashboard.jsx', false);
migrateFile('src/pages/employee/MyRequests.jsx', true);
