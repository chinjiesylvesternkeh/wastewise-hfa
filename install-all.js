import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Installing dependencies for all applications...\n');

const apps = [
  { name: 'Main Gateway', dir: 'main-app' },
  { name: 'Healthcare App', dir: 'apps/healthcare' },
  { name: 'Fitness App', dir: 'apps/fitness' },
  { name: 'Culinary App', dir: 'apps/culinary' }
];

function installDependencies(name, directory) {
  const appPath = path.join(__dirname, directory);
  
  if (!fs.existsSync(appPath)) {
    console.log(`❌ Directory ${directory} does not exist`);
    return false;
  }
  
  console.log(`📦 Installing dependencies for ${name}...`);
  
  try {
    execSync('npm install', {
      cwd: appPath,
      stdio: 'inherit'
    });
    console.log(`✅ ${name} dependencies installed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to install dependencies for ${name}:`, error.message);
    return false;
  }
}

// Install dependencies for all apps
let successCount = 0;
apps.forEach(app => {
  if (installDependencies(app.name, app.dir)) {
    successCount++;
  }
});

console.log(`\n🎉 Installation complete! ${successCount}/${apps.length} applications ready.`);

if (successCount === apps.length) {
  console.log('\n🚀 You can now start all applications with:');
  console.log('   node start-all.js');
  console.log('\n📱 Or start individual apps:');
  console.log('   cd main-app && npm start     (Gateway - Port 3000)');
  console.log('   cd apps/healthcare && npm start  (Healthcare - Port 3002)');
  console.log('   cd apps/fitness && npm start     (Fitness - Port 3003)');
  console.log('   cd apps/culinary && npm start    (Culinary - Port 3004)');
} else {
  console.log('\n⚠️  Some installations failed. Please check the errors above.');
}