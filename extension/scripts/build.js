import { build as buildVite } from 'vite';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

async function copyManifest() {
  const src = path.join(projectRoot, 'manifest.json');
  const dest = path.join(projectRoot, 'dist', 'manifest.json');
  
  if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
  }
  
  fs.copyFileSync(src, dest);
  console.log('✔ Copied manifest.json to dist/');
}

async function copyIcon() {
  const sizes = ['', '16', '32', '48', '128'];
  for (const size of sizes) {
    const filename = `icon${size}.png`;
    const src = path.join(projectRoot, filename);
    const dest = path.join(projectRoot, 'dist', filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✔ Copied ${filename} to dist/`);
    }
  }
}

async function copyLocales() {
  const src = path.join(projectRoot, '_locales');
  const dest = path.join(projectRoot, 'dist', '_locales');
  
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  
  function copyDir(srcDir, destDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir(src, dest);
  console.log('✔ Copied _locales to dist/');
}

async function main() {
  console.log(`Starting build (mode: ${isWatch ? 'watch' : 'production'})...`);
  
  // Create dist directory
  const distDir = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy manifest initially
  await copyManifest();

  // Copy icon initially
  await copyIcon();

  // Copy locales initially
  await copyLocales();

  // Watch manifest and locales in watch mode
  if (isWatch) {
    fs.watchFile(path.join(projectRoot, 'manifest.json'), async (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        try {
          await copyManifest();
        } catch (err) {
          console.error('Failed to copy manifest on change:', err);
        }
      }
    });

    const localesDir = path.join(projectRoot, '_locales');
    if (fs.existsSync(localesDir)) {
      fs.watch(localesDir, { recursive: true }, async () => {
        try {
          await copyLocales();
        } catch (err) {
          console.error('Failed to copy locales on change:', err);
        }
      });
    }
  }

  try {
    // 1. Content Script Esbuild Configuration
    const contentCtx = await esbuild.context({
      entryPoints: [path.join(projectRoot, 'src/content-script/index.ts')],
      bundle: true,
      outfile: path.join(projectRoot, 'dist/content-script.js'),
      minify: !isWatch,
      target: 'chrome100',
      format: 'iife', // Safe inside page context without ESM loader
      sourcemap: isWatch ? 'inline' : false,
      logLevel: 'info'
    });

    // 2. Background Script Esbuild Configuration
    const backgroundCtx = await esbuild.context({
      entryPoints: [path.join(projectRoot, 'src/background/index.ts')],
      bundle: true,
      outfile: path.join(projectRoot, 'dist/background.js'),
      minify: !isWatch,
      target: 'chrome100',
      format: 'esm', // Background is specified as "module" in manifest
      sourcemap: isWatch ? 'inline' : false,
      logLevel: 'info'
    });

    if (isWatch) {
      console.log('Watching content script and background script...');
      await contentCtx.watch();
      await backgroundCtx.watch();
    } else {
      console.log('Bundling content script and background script...');
      await contentCtx.rebuild();
      await backgroundCtx.rebuild();
      await contentCtx.dispose();
      await backgroundCtx.dispose();
      console.log('✔ Bundled scripts successfully.');
    }

    // 3. Vite Build for Side Panel React Application
    if (isWatch) {
      console.log('Starting Vite watch for Side Panel UI...');
      await buildVite({
        configFile: path.join(projectRoot, 'vite.config.ts'),
        build: {
          watch: {}
        }
      });
    } else {
      console.log('Building Side Panel UI with Vite...');
      await buildVite({
        configFile: path.join(projectRoot, 'vite.config.ts')
      });
      console.log('✔ Side Panel UI built successfully.');
    }

    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
