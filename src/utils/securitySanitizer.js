/**
 * Security & Sanitization Utilities for Enterprise QA
 * Protects against Cross-Site Scripting (XSS), obfuscated URI schemes, and malicious payloads.
 */

const DANGEROUS_TAG_NAMES = [
  'script',
  'iframe',
  'svg',
  'math',
  'style',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'link',
  'meta',
  'base',
  'noscript'
];

const DANGEROUS_PAIRED_REGEX = new RegExp(
  `<\\s*(?:${DANGEROUS_TAG_NAMES.join('|')})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*(?:${DANGEROUS_TAG_NAMES.join('|')})\\s*>`,
  'gi'
);

const DANGEROUS_SINGLE_REGEX = new RegExp(
  `<\\s*\\/?\\s*(?:${DANGEROUS_TAG_NAMES.join('|')})\\b[^>]*>?`,
  'gi'
);

function decodeEntitiesForInspection(value) {
  return String(value)
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(Number(dec) & 0xffff))
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16) & 0xffff))
    .replace(/&colon;/gi, ':')
    .replace(/&newline;/gi, '\n')
    .replace(/&tab;/gi, '\t');
}

/**
 * Validates URLs against javascript:, vbscript:, unsafe data: schemes, and protocol-relative bypasses.
 */
export function isSafeDisplayUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('//')) return false;

  const decoded = decodeEntitiesForInspection(trimmed);
  // eslint-disable-next-line no-control-regex
  const normalized = decoded.replace(/[\u0000-\u0020\u007f]+/g, '').toLowerCase();

  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:text/html') ||
    normalized.startsWith('data:image/svg+xml')
  ) {
    return false;
  }

  return true;
}

function scrubUnsafeAttributes(html) {
  return html
    // Strip quoted, single-quoted, or unquoted inline event handlers (on*)
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Strip inline style, srcdoc, and formaction vectors
    .replace(/\s+(?:style|srcdoc|formaction)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Validate href/src/xlink:href/action/poster (both quoted & unquoted) against entity/control obfuscation
    .replace(
      /\b(href|src|xlink:href|action|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      (match, attr, dqVal, sqVal, uqVal) => {
        const rawVal = dqVal ?? sqVal ?? uqVal ?? '';
        if (!isSafeDisplayUrl(rawVal)) {
          return `${attr}="#"`;
        }
        return match;
      }
    );
}

/**
 * Strips dangerous tags, unclosed constructs, obfuscated pseudo-protocols, and inline event handlers from text
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return text;

  let current = text.replace(/\0/g, '');
  let previous;
  let iterations = 0;

  do {
    previous = current;
    current = current
      .replace(DANGEROUS_PAIRED_REGEX, '')
      .replace(DANGEROUS_SINGLE_REGEX, '')
      .replace(/javascript\s*:/gi, '');
    current = scrubUnsafeAttributes(current);
    iterations++;
  } while (current !== previous && iterations < 10);

  return current.trim();
}

/**
 * Sanitizes editorial rich HTML content before rendering in article bodies or modals.
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  return sanitizeText(html);
}

/**
 * Converts HTML fragments to clean plain text for reading time, TTS, and previews.
 */
export function stripHtmlTags(input) {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects whether a content string contains structured HTML markup rather than plain text.
 */
export function isHtmlContent(text) {
  if (typeof text !== 'string') return false;
  return /<\/?(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|figure|figcaption|br|hr|strong|em|b|i|u|s|a|img|span|section|article)\b[^>]*>/i.test(
    text
  );
}

/**
 * Splits sanitized HTML into top-level block HTML strings for structured rendering and mid-article ads.
 */
export function extractHtmlBlocks(html) {
  const cleanHtml = sanitizeHtml(html);
  if (!cleanHtml) return [];

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
    const blocks = [];

    Array.from(doc.body.childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        const outer = node.outerHTML?.trim();
        if (outer) blocks.push(outer);
      } else if (node.nodeType === 3) {
        const text = node.textContent?.trim();
        if (text) blocks.push(`<p>${escapeHtml(text)}</p>`);
      }
    });

    if (blocks.length > 0) return blocks;
  }

  const parts = cleanHtml
    .split(/(?<=<\/(?:p|div|h[1-6]|ul|ol|blockquote|pre|figure|section|article)>)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [cleanHtml];
}

/**
 * Escapes HTML entities to render user strings safely
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates that an input is safe for SQL parameterized queries
 */
export function isSqlSafeParam(param) {
  return (
    typeof param === 'string' ||
    typeof param === 'number' ||
    typeof param === 'boolean' ||
    param === null ||
    param === undefined
  );
}

/**
 * Verifies that a SQL query statement uses parameterized placeholders rather than string interpolation
 */
export function verifyParameterizedQuery(query) {
  if (typeof query !== 'string') return false;
  const hasPlaceholders = /\$[0-9]+|\?|:[a-zA-Z0-9_]+/.test(query);
  const hasDirectConcatenation = /VALUES\s*\(\s*['"][^'"]*['"]\s*\)/i.test(query);
  return hasPlaceholders && !hasDirectConcatenation;
}
