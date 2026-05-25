import { spawn } from 'child_process';

const env = { ...process.env };
env.PATH = `/app/applet/bin:${env.PATH}`;

console.log('Spawning electron-builder with custom PATH:', env.PATH);

const cp = spawn('npx', ['electron-builder', '--win'], {
  env,
  stdio: 'inherit',
  shell: true,
});

cp.on('close', (code) => {
  console.log(`electron-builder process exited with code ${code}`);
  process.exit(code || 0);
});
