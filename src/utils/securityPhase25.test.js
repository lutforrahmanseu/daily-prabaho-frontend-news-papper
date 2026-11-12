import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  sanitizeHtml,
  sanitizeText,
  stripHtmlTags,
  isSafeDisplayUrl
} from './securitySanitizer.js';
import { fetchWithTimeout } from './fetchWithTimeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

test('Phase 25 XSS convergence: blocks nested script obfuscation and unclosed dangerous tags', () => {
  const nested = '<scr<script>ipt>alert("xss")</script><p>নিরাপদ সংবাদ</p>';
  const cleanedNested = sanitizeHtml(nested);
  assert.ok(!/script/i.test(cleanedNested), 'Nested script payload must be stripped');
  assert.ok(cleanedNested.includes('নিরাপদ সংবাদ'));

  const unclosedSvg = '<svg/onload=alert(1)<p>মূল কনটেন্ট</p>';
  const cleanedSvg = sanitizeHtml(unclosedSvg);
  assert.ok(!/<svg/i.test(cleanedSvg), 'Unclosed SVG must be removed');
  assert.ok(!/onload=/i.test(cleanedSvg), 'Unclosed event handler must be removed');
  assert.ok(cleanedSvg.includes('মূল কনটেন্ট'));
});

test('Phase 25 XSS attribute defense: strips unquoted event handlers, srcdoc, formaction, and inline styles', () => {
  const payload =
    '<div onclick=alert(1) onmouseenter="fetch(1)" style="background:url(evil)" formaction="https://evil.test" srcdoc="<script>1</script>"><img src="https://cdn.test/a.jpg" onerror=alert(9)>পাঠ্য</div>';
  const cleaned = sanitizeHtml(payload);

  assert.ok(!/onclick|onmouseenter|onerror/i.test(cleaned));
  assert.ok(!/style=/i.test(cleaned));
  assert.ok(!/srcdoc=/i.test(cleaned));
  assert.ok(!/formaction=/i.test(cleaned));
  assert.ok(cleaned.includes('https://cdn.test/a.jpg'));
  assert.ok(cleaned.includes('পাঠ্য'));
});

test('Phase 25 URI sanitizer: rejects entity-decoded, whitespace-split javascript/vbscript/data and protocol-relative URLs', () => {
  assert.equal(isSafeDisplayUrl('https://dailyprabaho.com/news'), true);
  assert.equal(isSafeDisplayUrl('/news/national'), true);
  assert.equal(isSafeDisplayUrl('#section-1'), true);

  assert.equal(isSafeDisplayUrl('javascript:alert(1)'), false);
  assert.equal(isSafeDisplayUrl('&#106;avascript:alert(1)'), false);
  assert.equal(isSafeDisplayUrl('&#x6A;avascript:alert(1)'), false);
  assert.equal(isSafeDisplayUrl('java\nscript:alert(1)'), false);
  assert.equal(isSafeDisplayUrl('vbscript:msgbox(1)'), false);
  assert.equal(isSafeDisplayUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeDisplayUrl('//phishing.example.com/login'), false);

  assert.equal(stripHtmlTags('  সাধারণ <b>টেক্সট</b>  '), 'সাধারণ টেক্সট');
  assert.equal(sanitizeText('  সাধারণ\0 টেক্সট  '), 'সাধারণ টেক্সট');
});

test('Phase 25 fetchWithTimeout: aborts stalled requests when timeout elapses', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (_url, options = {}) =>
      new Promise((_resolve, reject) => {
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted.');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });

    await assert.rejects(
      () => fetchWithTimeout('https://example.test/slow', {}, 25),
      (err) => err && err.name === 'AbortError'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Phase 25 ErrorBoundary & baseApi hardening checks pass static inspection', () => {
  const errorBoundarySrc = fs.readFileSync(
    path.join(rootDir, 'src/components/common/ErrorBoundary.jsx'),
    'utf8'
  );
  assert.ok(
    !errorBoundarySrc.includes('process.env.NODE_ENV'),
    'ErrorBoundary must use import.meta.env?.DEV in Vite instead of process.env.NODE_ENV'
  );
  assert.match(errorBoundarySrc, /import\.meta\.env\?\.DEV/);

  const baseApiSrc = fs.readFileSync(
    path.join(rootDir, 'src/store/api/baseApi.js'),
    'utf8'
  );
  assert.match(baseApiSrc, /timeout:\s*25000/);
  assert.match(baseApiSrc, /'Reliability'/);
});
