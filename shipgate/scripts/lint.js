'use strict';
// Dependency-free linter: syntax check + two house rules.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

const files = ['src', 'test', 'scripts'].flatMap(walk).filter((f) => f.endsWith('.js'));
let problems = 0;

for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    problems++;
    process.stderr.write(`SYNTAX ${f}\n${e.stderr}\n`);
  }
  const text = fs.readFileSync(f, 'utf8');
  if (!text.startsWith("'use strict'")) {
    problems++;
    process.stderr.write(`RULE ${f}: missing 'use strict'\n`);
  }
  if (f.startsWith('src') && /console\.log/.test(text)) {
    problems++;
    process.stderr.write(`RULE ${f}: console.log is banned in src/\n`);
  }
}

process.stdout.write(`Linted ${files.length} files, ${problems} problem(s)\n`);
process.exit(problems ? 1 : 0);
