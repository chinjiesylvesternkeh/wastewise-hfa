import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Integrated Wellness Platform...\n');

// Function to start a Node.js app
function startApp(name, directory, port) {
  console.log(`Starting ${name} on port ${port}...`);
  
  const app = spawn('npm', ['start'], {
    cwd: path.join(__dirname, directory),
    stdio: 'pipe',
    shell: true
  });

  app.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  app.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });

  app.on('close', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  return app;
}

// Start all applications
const apps = [
  { name: 'Gateway', dir: 'main-app', port: 3000 },
  { name: 'Healthcare', dir: 'apps/healthcare', port: 3002 },
  { name: 'Fitness', dir: 'apps/fitness', port: 3003 },
  { name: 'Culinary', dir: 'apps/culinary', port: 3004 }
];

const processes = [];

apps.forEach(app => {
  const process = startApp(app.name, app.dir, app.port);
  processes.push(process);
});

console.log('\n🌟 All applications starting...');
console.log('📱 Main Platform: http://localhost:3000');
console.log('🏥 Healthcare App: http://localhost:3002');
console.log('💪 Fitness App: http://localhost:3003');
console.log('🍽️ Culinary App: http://localhost:3004');
console.log('\nPress Ctrl+C to stop all applications\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all applications...');
  processes.forEach(proc => {
    proc.kill('SIGINT');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down all applications...');
  processes.forEach(proc => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});