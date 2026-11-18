import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/news-meta.js';

test('Social Preview API: generates valid Open Graph and Twitter Card tags with image', async () => {
  let capturedHeaders = {};
  let capturedStatus = 200;
  let capturedBody = '';

  const mockReq = {
    query: { slug: 'news-1794987610756' },
    url: '/api/news-meta?slug=news-1794987610756'
  };

  const mockRes = {
    setHeader(key, value) {
      capturedHeaders[key.toLowerCase()] = value;
    },
    status(code) {
      capturedStatus = code;
      return this;
    },
    send(body) {
      capturedBody = body;
      return this;
    },
    redirect(code, url) {
      capturedStatus = code;
      capturedBody = url;
      return this;
    }
  };

  await handler(mockReq, mockRes);

  assert.equal(capturedStatus, 200);
  assert.equal(capturedHeaders['content-type'], 'text/html; charset=utf-8');
  assert.ok(capturedHeaders['cache-control'].includes('s-maxage'));

  // Verify essential Open Graph tags for social crawlers (Facebook, WhatsApp, LinkedIn)
  assert.match(capturedBody, /<meta\s+property="og:type"\s+content="article"/);
  assert.match(capturedBody, /<meta\s+property="og:image"\s+content="https?:\/\/[^"]+"/);
  assert.match(capturedBody, /<meta\s+property="og:image:secure_url"/);
  assert.match(capturedBody, /<meta\s+property="og:title"/);
  assert.match(capturedBody, /<meta\s+property="og:description"/);
  assert.match(capturedBody, /<meta\s+property="og:url"/);

  // Verify Twitter Card tags
  assert.match(capturedBody, /<meta\s+name="twitter:card"\s+content="summary_large_image"/);
  assert.match(capturedBody, /<meta\s+name="twitter:image"/);
  assert.match(capturedBody, /<meta\s+name="twitter:title"/);

  // Verify canonical and auto-redirect fallback for human readers
  assert.match(capturedBody, /<link\s+rel="canonical"/);
  assert.match(capturedBody, /window\.location\.replace/);
});

test('Social Preview API: redirects to home when slug is missing', async () => {
  let redirectedUrl = '';
  let redirectedCode = 0;

  const mockReq = {
    query: {},
    url: '/api/news-meta'
  };

  const mockRes = {
    redirect(code, url) {
      redirectedCode = code;
      redirectedUrl = url;
    }
  };

  await handler(mockReq, mockRes);
  assert.equal(redirectedCode, 302);
  assert.ok(redirectedUrl.length > 0);
});

