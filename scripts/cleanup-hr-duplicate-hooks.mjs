import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hrDir = path.join(__dirname, '../src/components/hr');

function walk(dir, files = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, files);
        else if (ent.name.endsWith('.jsx')) files.push(p);
    }
    return files;
}

const HOOK = /^\s*const \{ t \} = useTranslation\(\['hr', 'common'\]\);\s*\n/gm;

for (const file of walk(hrDir)) {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const out = [];
    let seenComponentHook = false;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isHook = /const \{ t \} = useTranslation\(\['hr', 'common'\]\)/.test(line);

        if (isHook) {
            // Track brace depth at hook line
            const openBefore = (lines.slice(0, i).join('\n').match(/\{/g) || []).length;
            const closeBefore = (lines.slice(0, i).join('\n').match(/\}/g) || []).length;
            const depth = openBefore - closeBefore;
            if (!seenComponentHook && depth <= 1) {
                seenComponentHook = true;
                out.push(line);
            }
            // skip duplicate hooks
            continue;
        }
        out.push(line);
    }

    const next = out.join('\n');
    if (next !== content) {
        fs.writeFileSync(file, next);
        console.log('cleaned:', path.relative(path.join(__dirname, '..'), file));
    }
}
