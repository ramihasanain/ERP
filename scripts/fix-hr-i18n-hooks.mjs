/**
 * Ensure useTranslation(['hr', 'common']) hook in HR JSX components that use t().
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const hrDir = path.join(root, 'src/components/hr');
const HOOK = "    const { t } = useTranslation(['hr', 'common']);\n";

function walk(dir, files = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, files);
        else if (ent.name.endsWith('.jsx')) files.push(p);
    }
    return files;
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes("react-i18next")) return false;

    let changed = false;

    content = content.replace(
        /const\s*\{\s*t\s*\}\s*=\s*useTranslation\([^)]+\);/g,
        "const { t } = useTranslation(['hr', 'common']);"
    );
    content = content.replace(/t\('actions\.(\w+)',\s*\{\s*ns:\s*'common'\s*\}\)/g, "t('common:actions.$1')");
    content = content.replace(/t\('table\.(\w+)',\s*\{\s*ns:\s*'common'\s*\}\)/g, "t('common:table.$1')");

    // Add hook after each component opener that uses t( but lacks hook in next 5 lines
    const patterns = [
        /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/g,
        /function\s+\w+\s*\([^)]*\)\s*\{/g,
    ];

    for (const re of patterns) {
        let match;
        const reCopy = new RegExp(re.source, re.flags);
        while ((match = reCopy.exec(content)) !== null) {
            const start = match.index + match[0].length;
            const snippet = content.slice(start, start + 200);
            if (snippet.includes('useTranslation([') || !content.slice(match.index).includes('t(')) continue;
            // only if this function body contains t(
            const bodyEnd = findMatchingBrace(content, start - 1);
            const body = content.slice(start, bodyEnd);
            if (!body.includes('t(')) continue;
            if (body.includes('useTranslation([')) continue;

            content = content.slice(0, start) + '\n' + HOOK + content.slice(start);
            changed = true;
            reCopy.lastIndex = start + HOOK.length + 10;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log('fixed:', path.relative(root, filePath));
    }
    return changed;
}

function findMatchingBrace(content, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < content.length; i++) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return content.length;
}

const files = walk(hrDir);
let count = 0;
for (const f of files) {
    if (fixFile(f)) count++;
}
console.log(`Fixed ${count}/${files.length} files`);
