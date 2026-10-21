import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetScript = path.resolve(__dirname, '../vibecut-app/scripts/test-f04-silence-surgery.mjs');

const child = spawn(process.execPath, [targetScript], {
  stdio: 'inherit',
  env: process.env,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
