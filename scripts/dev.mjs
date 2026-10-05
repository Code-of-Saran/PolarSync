// Start the FastAPI backend and the Next.js frontend together.
//   npm run dev:all            (both)
//   npm run backend            (backend only)
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = join(root, 'backend');
const venvPython = [join(backendDir, '.venv', 'Scripts', 'python.exe'), join(backendDir, '.venv', 'bin', 'python')].find(existsSync);
const python = venvPython || (process.platform === 'win32' ? 'python' : 'python3');
const backendOnly = process.argv.includes('--backend-only');

if (!venvPython) {
  console.warn('[polarsync] backend/.venv not found — using system Python. Run: npm run setup:backend');
}

const procs = [];
function run(name, cmd, args, cwd, color) {
  const p = spawn(cmd, args, { cwd, shell: process.platform === 'win32' && cmd === 'npx', env: { ...process.env, PYTHONUNBUFFERED: '1' } });
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  const pipe = (stream, out) => stream.on('data', (d) => d.toString().split(/\r?\n/).filter(Boolean).forEach((l) => out.write(prefix + l + '\n')));
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  p.on('exit', (code) => { console.log(`${prefix}exited (${code})`); procs.forEach((x) => x !== p && x.kill()); process.exit(code ?? 0); });
  procs.push(p);
}

run('api', python, ['main.py'], backendDir, '36');
if (!backendOnly) run('web', 'npx', ['next', 'dev', '-p', '3000'], root, '35');
process.on('SIGINT', () => { procs.forEach((p) => p.kill()); process.exit(0); });
