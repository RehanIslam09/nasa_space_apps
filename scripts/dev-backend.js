/**
 * Cross-platform runner for the PRANA Python FastAPI backend.
 * Uses the local virtual environment in backend/.venv.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

const isWin = process.platform === 'win32';
const venvPython = isWin
  ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
  : path.join(backendDir, '.venv', 'bin', 'python');

if (!fs.existsSync(venvPython)) {
  console.error('\x1b[31m[Backend Orchestrator Error]\x1b[0m Python virtual environment not found at:');
  console.error(`  ${venvPython}`);
  console.error('\nPlease set up the backend virtual environment:');
  console.error('  cd backend');
  console.error('  python -m venv .venv');
  console.error(isWin ? '  .\\.venv\\Scripts\\pip install -r requirements.txt' : '  ./.venv/bin/pip install -r requirements.txt');
  process.exit(1);
}

const args = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'];

console.log('\x1b[33m[PRANA FastAPI]\x1b[0m Launching backend on http://127.0.0.1:8000 ...');

const child = spawn(venvPython, args, {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('\x1b[31m[Backend Failed to Start]\x1b[0m', err.message);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code || 0);
});

// Propagate termination signals cleanly
process.on('SIGINT', () => {
  if (child && !child.killed) child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  if (child && !child.killed) child.kill('SIGTERM');
});
