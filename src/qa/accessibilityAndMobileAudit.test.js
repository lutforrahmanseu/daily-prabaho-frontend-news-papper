import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

function collectFiles(dir, extensions) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(fullPath);
    }
  }
  return out;
}

test('Accessibility (WCAG): index.html defines lang, title, and pinch-zoom-safe responsive viewport', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.match(html, /<html[^>]+lang=/i);
  assert.match(html, /<title>[^<]+<\/title>/i);
  assert.match(html, /<meta[^>]+name="viewport"[^>]+width=device-width/i);
  assert.ok(
    !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(html),
    'Viewport meta must not disable pinch zoom for low-vision mobile users'
  );
  assert.match(html, /http-equiv="X-Content-Type-Options"/i);
  assert.match(html, /name="referrer"/i);
});

test('Accessibility (Keyboard & Landmarks): PublicLayout provides skip-to-content link and #main-content target', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'src/layouts/PublicLayout.jsx'), 'utf8');
  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /id="main-content"/);
  assert.match(layout, /<main\b/);
  assert.match(layout, /sr-only/);
  assert.match(layout, /focus:not-sr-only/);
});

test('Accessibility & RBAC UI: AdminLayout and AppRoutes wire System Reliability with mobile support', () => {
  const adminLayout = fs.readFileSync(path.join(rootDir, 'src/layouts/AdminLayout.jsx'), 'utf8');
  assert.match(adminLayout, /path:\s*'\/admin\/reliability'/);
  assert.match(adminLayout, /requiredPermission:\s*'settings\.manage'/);
  assert.match(adminLayout, /<main\b/);
  assert.match(adminLayout, /<aside\b/);

  const appRoutes = fs.readFileSync(path.join(rootDir, 'src/routes/AppRoutes.jsx'), 'utf8');
  assert.match(appRoutes, /AdminReliabilityPage/);
  assert.match(appRoutes, /path="reliability"/);

  const reliabilityPage = fs.readFileSync(
    path.join(rootDir, 'src/pages/admin/AdminReliabilityPage.jsx'),
    'utf8'
  );
  assert.match(reliabilityPage, /<h1\b/);
  assert.match(reliabilityPage, /role="status"/);
  assert.match(reliabilityPage, /overflow-x-auto/);
  assert.match(reliabilityPage, /sm:|lg:/);
});

test('Mobile Responsiveness: public hubs and admin consoles use responsive breakpoints and overflow guards', () => {
  const targetPages = [
    'src/pages/public/HomePage.jsx',
    'src/pages/public/NewsDetailsPage.jsx',
    'src/pages/public/EpaperReaderPage.jsx',
    'src/pages/public/MultimediaHubPage.jsx',
    'src/pages/public/EventsHubPage.jsx',
    'src/pages/public/CitizenSubmitPage.jsx',
    'src/pages/public/ReaderProfilePage.jsx',
    'src/pages/admin/AdminReliabilityPage.jsx'
  ].filter((rel) => fs.existsSync(path.join(rootDir, rel)));

  assert.equal(
    targetPages.length,
    8,
    'All 8 audited public and admin pages must exist for mobile responsiveness checks'
  );

  for (const relPath of targetPages) {
    const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
    assert.match(
      content,
      /\b(sm:|md:|lg:|xl:)/,
      `${relPath} must use responsive Tailwind breakpoints for mobile/tablet layouts`
    );
  }
});

test('Network Resilience: frontend runtime source uses fetchWithTimeout instead of raw un-timeouted fetch()', () => {
  const srcFiles = collectFiles(path.join(rootDir, 'src'), ['.js', '.jsx']).filter(
    (f) => !f.endsWith('.test.js') && !f.endsWith('fetchWithTimeout.js')
  );

  const violations = [];
  for (const filePath of srcFiles) {
    const raw = fs.readFileSync(filePath, 'utf8');
    // Ignore JSDoc/line comments when scanning for live fetch() invocations
    const codeOnly = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    if (/(?<![.\w$])fetch\s*\(/.test(codeOnly)) {
      violations.push(path.relative(rootDir, filePath));
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Un-timeouted raw fetch() calls found in: ${violations.join(', ')}`
  );
});
