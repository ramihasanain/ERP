/**
 * Batch-add useTranslation hooks and replace common UI strings.
 * Usage: node scripts/migrate-module-i18n.mjs <glob-dir> <namespace> [common]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const [, , targetDir, ns, useCommon] = process.argv;
if (!targetDir || !ns) {
    console.error('Usage: node scripts/migrate-module-i18n.mjs <relative-dir> <namespace> [common]');
    process.exit(1);
}

const COMMON_KEYS = {
    'Cancel': 'common:actions.cancel',
    'Save': 'common:actions.save',
    'Delete': 'common:actions.delete',
    'Edit': 'common:actions.edit',
    'Add': 'common:actions.add',
    'Search': 'common:actions.search',
    'Loading...': 'common:actions.loading',
    'No data available': 'common:table.noData',
    'No results found': 'common:table.noResults',
    'Back': 'common:actions.back',
    'Submit': 'common:actions.submit',
    'Close': 'common:actions.close',
    'Confirm': 'common:actions.confirm',
};

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, files);
        else if (ent.name.endsWith('.jsx')) files.push(p);
    }
    return files;
}

function ensureImport(content) {
    if (content.includes("from 'react-i18next'") || content.includes('from "react-i18next"')) return content;
    const importLine = useCommon
        ? "import { useTranslation } from 'react-i18next';\n"
        : `import { useTranslation } from 'react-i18next';\n`;
    const reactImport = content.match(/^import React[^\n]*\n/m);
    if (reactImport) {
        return content.replace(reactImport[0], reactImport[0] + importLine);
    }
    return importLine + content;
}

function ensureHook(content) {
    if (content.includes('useTranslation(')) return content;
    const hook = useCommon
        ? `    const { t } = useTranslation(['${ns}', 'common']);\n`
        : `    const { t } = useTranslation('${ns}');\n`;

    // Arrow function component
    const arrowMatch = content.match(/(const\s+\w+\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>\s*\{)\n/);
    if (arrowMatch) {
        return content.replace(arrowMatch[0], arrowMatch[0] + hook);
    }
    // function Component()
    const fnMatch = content.match(/(function\s+\w+\s*\([^)]*\)\s*\{)\n/);
    if (fnMatch) {
        return content.replace(fnMatch[0], fnMatch[0] + hook);
    }
    return content;
}

function replaceCommonStrings(content) {
    let out = content;
    for (const [str, key] of Object.entries(COMMON_KEYS)) {
        const patterns = [
            new RegExp(`>\\s*${str}\\s*<`, 'g'),
            new RegExp(`title="${str}"`, 'g'),
            new RegExp(`label="${str}"`, 'g'),
            new RegExp(`placeholder="${str}"`, 'g'),
            new RegExp(`aria-label="${str}"`, 'g'),
            new RegExp(`toast\\.success\\('${str.replace(/'/g, "\\'")}'\\)`, 'g'),
            new RegExp(`toast\\.error\\('${str.replace(/'/g, "\\'")}'\\)`, 'g'),
        ];
        for (const re of patterns) {
            out = out.replace(re, (m) => {
                if (m.includes('{t(')) return m;
                if (m.startsWith('>')) return `>{t('${key.split(':')[1]}', { ns: '${key.split(':')[0]}' })}<`;
                const attr = m.split('=')[0];
                return `${attr}={t('${key.split(':')[1]}', { ns: '${key.split(':')[0]}' })}`;
            });
        }
    }
    return out;
}

const absDir = path.join(root, targetDir);
const files = walk(absDir);
let changed = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const before = content;
    content = ensureImport(content);
    content = ensureHook(content);
    content = replaceCommonStrings(content);
    if (content !== before) {
        fs.writeFileSync(file, content);
        changed++;
        console.log('updated:', path.relative(root, file));
    }
}

console.log(`Done. ${changed}/${files.length} files updated in ${targetDir}`);
