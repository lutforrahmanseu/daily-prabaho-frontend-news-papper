import test from 'node:test';
import assert from 'node:assert/strict';
import newsMetaHandler from '../../api/news-meta.js';
import ogImageHandler from '../../api/og-image.js';

test('Social Preview API: generates valid Open Graph and Twitter Card tags with image', async () => {
  let capturedHeaders = {};
  let capturedStatus = 200;
  let capturedBody = '';

  const mockReq = {
    query: { slug: 'news-1794991454455' },
    url: '/api/news-meta?slug=news-1794991454455'
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

  await newsMetaHandler(mockReq, mockRes);

  assert.equal(capturedStatus, 200);
  assert.equal(capturedHeaders['content-type'], 'text/html; charset=utf-8');
  assert.ok(capturedHeaders['cache-control'].includes('s-maxage'));

  // Verify essential Open Graph tags for WhatsApp, Facebook, Telegram
  assert.match(capturedBody, /<meta\s+property="og:type"\s+content="article"/);
  assert.match(capturedBody, /<meta\s+property="og:image"\s+content="https?:\/\/[^"]+\/api\/og-image\/news-1794991454455\.jpg"/);
  assert.match(capturedBody, /<meta\s+property="og:image:secure_url"/);
  assert.match(capturedBody, /<meta\s+property="og:image:type"\s+content="image\/jpeg"/);
  assert.match(capturedBody, /<meta\s+property="og:title"/);
  assert.match(capturedBody, /<meta\s+property="og:description"/);
  assert.match(capturedBody, /<meta\s+property="og:url"/);

  // Verify Twitter Card tags
  assert.match(capturedBody, /<meta\s+name="twitter:card"\s+content="summary_large_image"/);
  assert.match(capturedBody, /<meta\s+name="twitter:image"/);
  assert.match(capturedBody, /<meta\s+name="twitter:title"/);

  // Verify canonical and client redirect
  assert.match(capturedBody, /<link\s+rel="canonical"/);
  assert.match(capturedBody, /window\.location\.replace/);
  // Ensure no http-equiv refresh is present (to avoid crawler redirect loop)
  assert.ok(!capturedBody.includes('http-equiv="refresh"'));
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

  await newsMetaHandler(mockReq, mockRes);
  assert.equal(redirectedCode, 302);
  assert.ok(redirectedUrl.length > 0);
});

test('OG Image API: delivers optimized JPEG under 300KB for WhatsApp compatibility', async () => {
  let capturedHeaders = {};
  let capturedStatus = 200;
  let capturedBody = null;

  const mockReq = {
    query: { slug: 'news-1794991454455' }
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
    }
  };

  await ogImageHandler(mockReq, mockRes);
  assert.equal(capturedStatus, 200);
  assert.equal(capturedHeaders['content-type'], 'image/jpeg');
  assert.ok(capturedBody && capturedBody.length > 0);
  // WhatsApp requires images < 300KB (307,200 bytes)
  assert.ok(capturedBody.length < 307200, `Image size ${capturedBody.length} bytes must be < 300KB`);
});
