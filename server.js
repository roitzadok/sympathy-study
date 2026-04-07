import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 8080;

// Start Vite dev server as a child process
const viteProcess = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', port.toString()], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

viteProcess.on('error', (err) => {
  console.error('Failed to start Vite dev server:', err);
  process.exit(1);
});

viteProcess.on('exit', (code) => {
  console.log(`Vite dev server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  viteProcess.kill('SIGTERM');
  process.exit(0);
});

console.log(`Starting Vite dev server on port ${port}...`);
