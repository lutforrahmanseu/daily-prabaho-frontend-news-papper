/**
 * Vercel Serverless Function: Dynamic OpenGraph & Social Media Preview Generator
 *
 * Intercepts requests from social media scrapers (Facebook, WhatsApp, Twitter/X,
 * LinkedIn, Telegram, Discord, etc.) and injects dynamic og:image, og:title,
 * og:description, and Twitter card metadata for news articles.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function stripHtml(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  // Extract slug from query or url path
  let slug = req.query?.slug;
  if (!slug && req.url) {
    const urlParts = req.url.split('?')[0].split('/');
    const lastPart = urlParts.filter(Boolean).pop();
    if (lastPart && lastPart !== 'news-meta' && lastPart !== 'news') {
      slug = lastPart;
    }
  }

  const siteUrl = process.env.VITE_APP_URL || 'https://daily-prabaho-nine.vercel.app';
  const defaultApiOrigin = 'https://daily-prabaho-api.onrender.com';
  const apiBase = process.env.VITE_API_URL || `${defaultApiOrigin}/api/v1`;

  if (!slug) {
    return res.redirect(302, siteUrl);
  }

  const canonicalUrl = `${siteUrl}/news/${slug}`;
  // The optimized image endpoint guarantees image size < 120KB for WhatsApp (< 300KB requirement)
  const optimizedImageUrl = `${siteUrl}/api/og-image?slug=${encodeURIComponent(slug)}`;
  let title = 'দৈনিক বার্তা প্রবাহ (Daily Prabaho)';
  let description = 'বাংলাদেশ ও আন্তর্জাতিক বিশ্বের সর্বশেষ নির্ভরযোগ্য সংবাদ, রাজনীতি, বাণিজ্য, খেলাধুলা, বিজ্ঞান ও প্রযুক্তির সত্যনিষ্ঠ বিশ্লেষণ।';
  let publishedTime = new Date().toISOString();
  let categoryName = 'সংবাদ';
  let authorName = 'দৈনিক বার্তা প্রবাহ ডেস্ক';

  try {
    const endpoint = apiBase.startsWith('http')
      ? `${apiBase}/news/${encodeURIComponent(slug)}`
      : `${defaultApiOrigin}/api/v1/news/${encodeURIComponent(slug)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const apiRes = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DailyPrabaho-SocialPreview/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const payload = await apiRes.json();
      const article = payload?.data || payload;
      if (article && typeof article === 'object') {
        if (article.title) {
          title = article.title;
        }

        const rawSummary = article.summary || article.subheadline || article.content;
        if (rawSummary) {
          const stripped = stripHtml(rawSummary);
          if (stripped.length > 0) {
            description = stripped.slice(0, 220);
          }
        }

        if (article.category?.name_bn || article.category?.name) {
          categoryName = article.category.name_bn || article.category.name;
        }
        if (article.author?.name || article.reporter?.name) {
          authorName = article.author?.name || article.reporter?.name;
        }
        if (article.published_at) {
          publishedTime = article.published_at;
        }
      }
    }
  } catch (err) {
    console.error(`[SocialPreview] Failed to fetch article "${slug}":`, err?.message || err);
  }

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImg = escapeHtml(optimizedImageUrl);
  const safeUrl = escapeHtml(canonicalUrl);
  const safeCategory = escapeHtml(categoryName);
  const safeAuthor = escapeHtml(authorName);

  // Cache response at Vercel Edge CDN for 10 minutes, serve stale while revalidating for 24 hours
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');

  const html = `<!doctype html>
<html lang="bn" prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb# article: https://ogp.me/ns/article#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} | দৈনিক বার্তা প্রবাহ</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Canonical -->
  <link rel="canonical" href="${safeUrl}" />

  <!-- Open Graph / Facebook / WhatsApp / LinkedIn / Telegram -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="দৈনিক বার্তা প্রবাহ (Daily Prabaho)" />
  <meta property="og:locale" content="bn_BD" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImg}" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="450" />
  <meta property="article:published_time" content="${publishedTime}" />
  <meta property="article:section" content="${safeCategory}" />
  <meta property="article:author" content="${safeAuthor}" />

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@dailyprabaho" />
  <meta name="twitter:creator" content="@dailyprabaho" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImg}" />

  <!-- Client redirect for human readers (omitting http-equiv refresh to prevent crawler redirect loops) -->
  <script>
    if (typeof window !== 'undefined') {
      window.location.replace("${safeUrl}");
    }
  </script>
</head>
<body style="font-family: 'Hind Siliguri', sans-serif; padding: 24px; line-height: 1.6; max-width: 768px; margin: 0 auto; color: #1c1917;">
  <article>
    <span style="font-size: 13px; font-weight: bold; color: #b91c1c; text-transform: uppercase;">${safeCategory}</span>
    <h1 style="font-size: 24px; line-height: 1.35; margin: 12px 0; color: #0c0a09;">${safeTitle}</h1>
    <p style="font-size: 15px; color: #44403c; margin-bottom: 16px;">${safeDesc}</p>
    <img src="${safeImg}" alt="${safeTitle}" style="max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e7e5e4;" />
    <p><a href="${safeUrl}" style="display: inline-block; background: #b91c1c; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">সম্পূর্ণ সংবাদ পড়ুন</a></p>
  </article>
</body>
</html>`;

  return res.status(200).send(html);
}
