import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const backendDir = [
  process.env.BACKEND_DIR,
  path.resolve(rootDir, '../backend'),
  path.join(rootDir, 'backend')
].find((candidate) => candidate && fs.existsSync(path.join(candidate, 'artisan')));

function resolveBackendAsset(relPath) {
  if (!backendDir) return null;
  const direct = path.join(backendDir, relPath);
  if (fs.existsSync(direct)) return direct;
  const trimmed = relPath.replace(/^backend\//, '');
  const insideBackend = path.join(backendDir, trimmed);
  if (fs.existsSync(insideBackend)) return insideBackend;
  return direct;
}

// ==========================================
// 1. ENVIRONMENT CONFIGURATION & SECRETS SAFETY
// ==========================================

test('Deployment: Frontend environment templates exist and define required keys', () => {
  const envExamplePath = path.join(rootDir, '.env.example');
  const envProdPath = path.join(rootDir, '.env.production');

  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  assert.ok(fs.existsSync(envProdPath), '.env.production must exist');

  const contentExample = fs.readFileSync(envExamplePath, 'utf8');
  assert.match(contentExample, /VITE_APP_NAME=/);
  assert.match(contentExample, /VITE_API_URL=/);
  assert.match(contentExample, /VITE_APP_URL=/);
});

test('Deployment: Backend environment template exists and defines production services', (t) => {
  if (!backendDir) return t.skip('Standalone frontend checkout without sibling backend repo');
  const backendEnvPath = resolveBackendAsset('.env.production.example');
  assert.ok(fs.existsSync(backendEnvPath), 'backend/.env.production.example must exist');

  const content = fs.readFileSync(backendEnvPath, 'utf8');
  assert.match(content, /APP_ENV=production/);
  assert.match(content, /APP_DEBUG=false/);
  assert.match(content, /DB_CONNECTION=pgsql/);
  assert.match(content, /QUEUE_CONNECTION=redis/);
  assert.match(content, /CACHE_STORE=redis/);
});

test('Deployment Security: Zero real secrets or hardcoded passwords in environment templates', () => {
  const templates = [
    path.join(rootDir, '.env.example'),
    path.join(rootDir, '.env.production'),
    ...(backendDir ? [resolveBackendAsset('.env.production.example')] : [])
  ].filter(Boolean);

  templates.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    // Ensure placeholder strings are used, never actual secrets
    assert.ok(!content.includes('password123'), `${filePath} must not contain naive password`);
    assert.ok(!content.includes('sk_live_'), `${filePath} must not contain live secret keys`);
    assert.ok(!content.includes('AKIA'), `${filePath} must not contain active AWS access keys`);
  });
});

// ==========================================
// 2. BACKEND PRODUCTION CONFIGURATION FILES
// ==========================================

test('Deployment: Laravel production config files exist and configure production drivers', (t) => {
  if (!backendDir) return t.skip('Standalone frontend checkout without sibling backend repo');
  const configFiles = [
    'config/app.php',
    'config/database.php',
    'config/queue.php',
    'config/cache.php',
    'config/filesystems.php',
    'config/logging.php'
  ];

  configFiles.forEach((relPath) => {
    const fullPath = resolveBackendAsset(relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
  });

  // Verify app.php timezone
  const appConfig = fs.readFileSync(resolveBackendAsset('config/app.php'), 'utf8');
  assert.match(appConfig, /Asia\/Dhaka/);

  // Verify queue.php redis connection
  const queueConfig = fs.readFileSync(resolveBackendAsset('config/queue.php'), 'utf8');
  assert.match(queueConfig, /'driver'\s*=>\s*'redis'/);

  // Verify cache.php redis store
  const cacheConfig = fs.readFileSync(resolveBackendAsset('config/cache.php'), 'utf8');
  assert.match(cacheConfig, /'driver'\s*=>\s*'redis'/);

  // Verify logging.php daily rotation
  const logConfig = fs.readFileSync(resolveBackendAsset('config/logging.php'), 'utf8');
  assert.match(logConfig, /'driver'\s*=>\s*'daily'/);
});

// ==========================================
// 3. INFRASTRUCTURE & AUTOMATION SCRIPTS
// ==========================================

test('Deployment: Nginx configuration specifies rate-limiting, SSL and security headers', (t) => {
  if (!backendDir) return t.skip('Standalone frontend checkout without sibling backend repo');
  const nginxPath = resolveBackendAsset('deploy/nginx/dailyprabaho.conf');
  assert.ok(fs.existsSync(nginxPath), 'deploy/nginx/dailyprabaho.conf must exist');

  const content = fs.readFileSync(nginxPath, 'utf8');
  assert.match(content, /server_name\s+dailyprabaho\.com/);
  assert.match(content, /ssl_protocols\s+TLSv1\.2\s+TLSv1\.3/);
  assert.match(content, /Strict-Transport-Security/);
  assert.match(content, /X-Frame-Options/);
  assert.match(content, /limit_req_zone/);
  assert.match(content, /fastcgi_pass/);
});

test('Deployment: Supervisor and Systemd configurations exist', (t) => {
  if (!backendDir) return t.skip('Standalone frontend checkout without sibling backend repo');
  const supervisorPath = resolveBackendAsset('deploy/supervisor/newsflow-worker.conf');
  const servicePath = resolveBackendAsset('deploy/systemd/newsflow-scheduler.service');
  const timerPath = resolveBackendAsset('deploy/systemd/newsflow-scheduler.timer');

  assert.ok(fs.existsSync(supervisorPath), 'Supervisor config must exist');
  assert.ok(fs.existsSync(servicePath), 'Systemd service must exist');
  assert.ok(fs.existsSync(timerPath), 'Systemd timer must exist');

  const supervisorContent = fs.readFileSync(supervisorPath, 'utf8');
  assert.match(supervisorContent, /command=php.*artisan\s+queue:work/);
  assert.match(supervisorContent, /numprocs=\d+/);
});

test('Deployment: Automated bash scripts exist and specify strict error handling', (t) => {
  if (!backendDir) return t.skip('Standalone frontend checkout without sibling backend repo');
  const scripts = [
    'deploy/scripts/deploy.sh',
    'deploy/scripts/backup-db.sh',
    'deploy/scripts/rollback.sh'
  ];

  scripts.forEach((relPath) => {
    const fullPath = resolveBackendAsset(relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.match(content, /#!\/usr\/bin\/env bash/, `${relPath} must have bash shebang`);
    assert.match(content, /set -euo pipefail/, `${relPath} must enforce strict error handling`);
  });
});

// ==========================================
// 4. DOCUMENTATION DELIVERABLES
// ==========================================

test('Deployment: All 6 required production documentation guides exist and are populated', (t) => {
  if (!backendDir) return t.skip('Standalone frontend checkout without sibling backend repo');
  const docFiles = [
    'docs/DEPLOYMENT_GUIDE.md',
    'docs/ENV_VARIABLES_TEMPLATE.md',
    'docs/PRODUCTION_CHECKLIST.md',
    'docs/BACKUP_AND_RECOVERY_GUIDE.md',
    'docs/SECURITY_CHECKLIST.md',
    'docs/ROLLBACK_INSTRUCTIONS.md'
  ];

  docFiles.forEach((relPath) => {
    const fullPath = resolveBackendAsset(relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
    const stats = fs.statSync(fullPath);
    assert.ok(stats.size > 500, `${relPath} must be substantive (got ${stats.size} bytes)`);
  });
});

