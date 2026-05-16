/**
 * Apply curated HR i18n string replacements to JSX files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const hrDir = path.join(root, 'src/components/hr');

const IMPORT = "import { useTranslation } from 'react-i18next';\n";
const HOOK = "    const { t } = useTranslation(['hr', 'common']);\n";

// [exact string or regex source, replacement] — order matters (longer first)
const GLOBAL_REPLACEMENTS = [
    ["toast.error(typeof message === 'string' ? message : 'Could not save payroll adjustments.')", "toast.error(translateApiError(error, 'hr:runPayroll.adjustmentsSaveFailed'))"],
    ["toast.error(typeof message === 'string' ? message : 'Could not start payroll calculation.')", "toast.error(translateApiError(error, 'hr:payroll.calculationFailed'))"],
    ["toast.error(typeof message === 'string' ? message : 'Could not calculate termination.')", "toast.error(translateApiError(error, 'hr:termination.calculateFailed'))"],
    ["toast.error(typeof msg === 'string' ? msg : 'Update failed.')", "toast.error(translateApiError(error, 'hr:finalSettlement.updateFailed'))"],
    ["toast.error(typeof msg === 'string' ? msg : 'Finalize failed.')", "toast.error(translateApiError(error, 'hr:finalSettlement.finalizeFailed'))"],
    ["toast.success('Payroll finalized and journal entries posted.')", "toast.success(t('payroll.finalized'))"],
    ["toast.success('Payroll calculation started.')", "toast.success(t('payroll.calculationStarted'))"],
    ["toast.success('Department deleted successfully.')", "toast.success(t('organization.departmentDeleted'))"],
    ["toast.success('Position deleted successfully.')", "toast.success(t('organization.positionDeleted'))"],
    ["toast.success('Department updated successfully.')", "toast.success(t('organization.departmentUpdated'))"],
    ["toast.success('Department created successfully.')", "toast.success(t('organization.departmentCreated'))"],
    ["toast.success('Position updated successfully.')", "toast.success(t('organization.positionUpdated'))"],
    ["toast.success('Position created successfully.')", "toast.success(t('organization.positionCreated'))"],
    ["toast.success('Employee created successfully.')", "toast.success(t('employeeDetails.created'))"],
    ["toast.success('Employee updated successfully.')", "toast.success(t('employeeDetails.updated'))"],
    ["toast.success('Leave request created successfully.')", "toast.success(t('employeeDetails.leaveCreated'))"],
    ["toast.success('Document uploaded successfully.')", "toast.success(t('employeeDetails.documentUploaded'))"],
    ["toast.success('Employee login link copied.')", "toast.success(t('employeeDirectory.loginLinkCopied'))"],
    ["toast.error('Could not copy the link.')", "toast.error(t('employeeDirectory.loginLinkCopyFailed'))"],
    ["toast.error('Please choose a file before uploading.')", "toast.error(t('employeeDetails.chooseFile'))"],
    ["toast.success('Tax brackets saved successfully.')", "toast.success(t('taxSlabs.saved'))"],
    ["toast.success('Salary component updated successfully.')", "toast.success(t('salaryComponents.updated'))"],
    ["toast.success('Salary component created successfully.')", "toast.success(t('salaryComponents.created'))"],
    ["toast.success('Salary component deleted successfully.')", "toast.success(t('salaryComponents.deleted'))"],
    ["toast.success('Salary structure updated successfully.')", "toast.success(t('salaryStructures.updated'))"],
    ["toast.success('Salary structure created successfully.')", "toast.success(t('salaryStructures.created'))"],
    ["toast.success('Salary structure deleted successfully.')", "toast.success(t('salaryStructures.deleted'))"],
    ["toast.error('Please fill in template name and body.')", "toast.error(t('contractTemplates.fillRequired'))"],
    ["toast.success('Template updated successfully.')", "toast.success(t('contractTemplates.updated'))"],
    ["toast.success('Template created successfully.')", "toast.success(t('contractTemplates.created'))"],
    ["toast.success('Template deleted successfully.')", "toast.success(t('contractTemplates.deleted'))"],
    ["toast.error('Please select an employee for preview.')", "toast.error(t('contractTemplates.selectEmployeePreview'))"],
    ["toast.error('Template render returned empty HTML.')", "toast.error(t('contractTemplates.emptyRender'))"],
    ["toast.success('Copied to clipboard.')", "toast.success(t('contractTemplates.copied'))"],
    ["toast.error('Please fill in all required project fields.')", "toast.error(t('projects.fillRequired'))"],
    ["toast.error('Start date must be before end date.')", "toast.error(t('projects.dateOrder'))"],
    ["toast.success('Termination finalized.')", "toast.success(t('finalSettlement.finalized'))"],
    ['toast.error("Please select a currency.")', "toast.error(t('contractSalary.selectCurrency'))"],
    ['toast.success("Salary increase saved.")', "toast.success(t('contractSalary.increaseSaved'))"],
    ['toast.error("Employee is required to record a salary increase.")', "toast.error(t('contractSalary.employeeRequiredIncrease'))"],
    ['toast.error("Employee is required to save a performance evaluation.")', "toast.error(t('contractSalary.employeeRequiredEval'))"],
    ['toast.success("Performance evaluation saved.")', "toast.success(t('contractSalary.evalSaved'))"],
    ['toast.success("Contract entry deleted.")', "toast.success(t('contractSalary.entryDeleted'))"],
    ['toast.error("Please select a contract template first.")', "toast.error(t('contractSalary.selectTemplate'))"],
    ['toast.success("Contract template generated.")', "toast.success(t('contractSalary.templateGenerated'))"],
    ['toast.success("Copied to clipboard.")', "toast.success(t('contractSalary.copied'))"],
    ['>HR & Payroll<', ">{t('dashboard.title')}<"],
    ['>Organization<', ">{t('organization.title')}<"],
    ['>Attendance<', ">{t('attendance.title')}<"],
    ['>Leave Requests<', ">{t('leaveRequests.title')}<"],
    ['>Departments<', ">{t('organization.departments')}<"],
    ['>Job Positions<', ">{t('organization.jobPositions')}<"],
    ["title=\"Evaluation Settings\"", "title={t('evaluationSettings.title')}"],
    ["title=\"Organization\"", "title={t('organization.title')}"],
];

function walk(dir, files = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, files);
        else if (ent.name.endsWith('.jsx')) files.push(p);
    }
    return files;
}

function ensureImport(content) {
    if (content.includes('react-i18next')) return content;
    const reactImport = content.match(/^import React[^\n]*\n/m);
    if (reactImport) return content.replace(reactImport[0], reactImport[0] + IMPORT);
    return IMPORT + content;
}

function ensureTranslateImport(content) {
    if (!content.includes('toast.error') && !content.includes('toast.success')) return content;
    if (content.includes('translateApiError')) return content;
    const toastImport = content.match(/import \{ toast \} from 'sonner';\n/);
    if (toastImport) {
        return content.replace(toastImport[0], toastImport[0] + "import translateApiError from '@/utils/translateApiError';\n");
    }
    return content;
}

function ensureHookInMainComponent(content, exportName) {
    if (content.includes("useTranslation(['hr', 'common'])")) return content;
    const re = new RegExp(`(const ${exportName} = \\([^)]*\\) => \\{)\\n`);
    if (re.test(content)) {
        return content.replace(re, `$1\n${HOOK}`);
    }
    return content;
}

const files = walk(hrDir);
let changed = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const before = content;

    content = ensureImport(content);

    const exportMatch = content.match(/export default (\w+)/);
    if (exportMatch) content = ensureHookInMainComponent(content, exportMatch[1]);

    for (const [from, to] of GLOBAL_REPLACEMENTS) {
        if (content.includes(from)) content = content.split(from).join(to);
    }

    content = ensureTranslateImport(content);

    // Fix toast.error(message) patterns to translateApiError where catch has `error`
    content = content.replace(/toast\.error\(message\)/g, "toast.error(translateApiError(error, 'hr:errors.generic'))");

    if (content !== before) {
        fs.writeFileSync(file, content);
        changed++;
        console.log('updated:', path.relative(root, file));
    }
}

console.log(`Done: ${changed} files`);
