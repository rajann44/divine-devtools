import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  // 1. Run build
  console.log('Building extension...');
  try {
    execSync('node scripts/build.js', { cwd: projectRoot, stdio: 'inherit' });
  } catch (err) {
    console.error('Build step failed, aborting packaging.');
    process.exit(1);
  }
  
  // 2. Read version from manifest
  const manifestPath = path.join(projectRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('manifest.json not found in extension root.');
    process.exit(1);
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version || '1.0.0';
  const zipName = `divine-devtools-v${version}.zip`;
  
  // 3. Create ZIP from dist directory
  console.log(`Packaging dist/ to ${zipName}...`);
  const distDir = path.join(projectRoot, 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('dist/ folder does not exist. Run build first.');
    process.exit(1);
  }
  
  try {
    // Delete old zip if it exists in the extension root
    const zipPath = path.join(projectRoot, zipName);
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    // Run zip command from the dist directory to package only compiled files
    execSync(`zip -r "../${zipName}" .`, { cwd: distDir, stdio: 'inherit' });
    console.log(`\n✔ Successfully packaged extension into ${zipName}`);
  } catch (error) {
    console.error('Failed to create ZIP package:', error);
    process.exit(1);
  }
}

main();
