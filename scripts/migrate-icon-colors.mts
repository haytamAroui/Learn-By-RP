import { readFileSync, writeFileSync, globSync } from 'node:fs';

/**
 * Replaces `color="rgb(var(--color-token))"` on icons with a runtime token lookup.
 *
 * An SVG stroke attribute cannot resolve a CSS custom property, so every icon
 * passed this way rendered as nothing on web. Migrating call sites is safer than
 * patching react-native-svg, because it fixes the class of bug rather than one
 * component.
 */
const files = globSync('src/**/*.tsx', { cwd: process.cwd() });

const PATTERN = /color="rgb\(var\(--color-([a-zA-Z]+)\)\)"/g;
const IMPORT_PATH = (file: string) => {
  const depth = file.split(/[\\/]/).length - 1;
  return depth === 0 ? './iconColor' : '../'.repeat(depth - 1) + 'design/iconColor';
};

let total = 0;
const touched: string[] = [];

for (const file of files) {
  let source = readFileSync(file, 'utf8');
  const original = source;

  let count = 0;
  source = source.replace(PATTERN, (_match, token: string) => {
    count += 1;
    return `color={iconColor('${token}')}`;
  });

  if (count === 0 || source === original) continue;

  if (!source.includes('iconColor')) {
    const specifier = IMPORT_PATH(file);
    source = `import { iconColor } from '${specifier}';\n` + source;
  }

  writeFileSync(file, source, 'utf8');
  total += count;
  touched.push(`${count}  ${file}`);
}

console.log(`migrated ${total} icon colour sites across ${touched.length} files`);
touched.forEach(line => console.log(`  ${line}`));