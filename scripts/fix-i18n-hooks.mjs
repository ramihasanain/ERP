import fs from 'fs';
import path from 'path';

const dirs = [
  ['src/components/Inventory', "['inventory', 'common']"],
  ['src/components/Procurement', "['procurement', 'common']"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.jsx')) files.push(p);
  }
  return files;
}

for (const [relDir, ns] of dirs) {
  const dir = path.join(process.cwd(), relDir);
  for (const file of walk(dir)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('react-i18next')) continue;
    if (content.includes('const { t') || content.includes('const {t')) continue;

    const hook = `    const { t } = useTranslation(${ns});\n`;

    const patterns = [
      /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{\n)/,
      /(const\s+\w+\s*=\s*\(\)\s*=>\s*\{\n)/,
      /(function\s+\w+\s*\([^)]*\)\s*\{\n)/,
    ];

    let updated = false;
    for (const re of patterns) {
      const m = content.match(re);
      if (m && !m[0].includes('useTranslation')) {
        content = content.replace(re, m[0] + hook);
        updated = true;
        break;
      }
    }

    if (updated) {
      fs.writeFileSync(file, content);
      console.log('hook:', file);
    }
  }
}
