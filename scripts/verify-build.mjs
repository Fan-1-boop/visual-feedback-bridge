import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(projectRoot, 'dist');
const manifestPath = resolve(distDir, 'manifest.json');

function fail(message) {
  console.error(`[verify-build] ${message}`);
  process.exitCode = 1;
}

if (!existsSync(manifestPath)) {
  fail('Missing dist/manifest.json. Run the production build first.');
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const referencedEntries = new Set([
    manifest.action?.default_popup,
    manifest.background?.service_worker,
    ...manifest.content_scripts.flatMap((entry) => entry.js ?? []),
  ]);

  for (const relativePath of referencedEntries) {
    if (!relativePath) continue;
    if (!existsSync(resolve(distDir, relativePath))) {
      fail(`Manifest references a missing file: dist/${relativePath}`);
    }
  }

  const contentScriptPath = manifest.content_scripts?.[0]?.js?.[0];
  if (!contentScriptPath) {
    fail('Manifest does not declare a Content Script entry.');
  } else {
    const absoluteContentPath = resolve(distDir, contentScriptPath);
    if (existsSync(absoluteContentPath)) {
      try {
        new Script(readFileSync(absoluteContentPath, 'utf8'), {
          filename: absoluteContentPath,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        fail(`Content Script is not valid classic JavaScript: ${message}`);
      }
    }
  }
}

if (!process.exitCode) {
  console.log('[verify-build] Manifest entries exist and Content Script is classic-script compatible.');
}
