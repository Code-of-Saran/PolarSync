// Create backend/.venv and install the API requirements.
//   npm run setup:backend          core (FastAPI + numpy; LSA semantic search)
//   npm run setup:backend -- --ml  also installs sentence-transformers (CPU torch)
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = join(dirname(fileURLToPath(import.meta.url)), '..', 'backend');
const sys = process.platform === 'win32' ? 'python' : 'python3';
const venvPy = process.platform === 'win32' ? join(backend, '.venv', 'Scripts', 'python.exe') : join(backend, '.venv', 'bin', 'python');
const sh = (cmd, args) => {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: backend, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (!existsSync(venvPy)) sh(sys, ['-m', 'venv', '.venv']);
sh(venvPy, ['-m', 'pip', 'install', '-r', 'requirements.txt']);
if (process.argv.includes('--ml')) {
  sh(venvPy, ['-m', 'pip', 'install', 'torch', '--index-url', 'https://download.pytorch.org/whl/cpu']);
  sh(venvPy, ['-m', 'pip', 'install', '-r', 'requirements-ml.txt']);
}
console.log('\nBackend ready. Start everything with: npm run dev:all');
