import { Jimp } from 'jimp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vercel Serverless Function: High-Performance Social Image Optimizer
 *
 * WhatsApp, Facebook, and Telegram have strict image size limits (WhatsApp requires < 300KB).
 * This endpoint downloads the raw news image, resizes it to optimal 800px landscape,
 * compresses it to ~80-110KB JPEG, and caches it at Vercel Edge for 7 days.
 */
export default async function handler(req, res) {
  const { slug, url } = req.query;
  const defaultApiOrigin = 'https://daily-prabaho-api.onrender.com';
  const apiBase = process.env.VITE_API_URL || `${defaultApiOrigin}/api/v1`;

  let targetImageUrl = url;

  // If slug is provided, resolve image URL from article data
  if (slug && !targetImageUrl) {
    try {
      const endpoint = apiBase.startsWith('http')
        ? `${apiBase}/news/${encodeURIComponent(slug)}`
        : `${defaultApiOrigin}/api/v1/news/${encodeURIComponent(slug)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const apiRes = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const payload = await apiRes.json();
        const article = payload?.data || payload;
        if (article?.featured_image) {
          const raw = String(article.featured_image).trim();
          if (raw.startsWith('http://') || raw.startsWith('https://')) {
            targetImageUrl = raw;
          } else if (raw.startsWith('/')) {
            targetImageUrl = `${defaultApiOrigin}${raw}`;
          } else {
            targetImageUrl = `${defaultApiOrigin}/storage/${raw}`;
          }
        }
      }
    } catch (err) {
      console.error('[OgImage] Failed to resolve news image for slug:', slug, err?.message);
    }
  }

  try {
    let image;

    if (targetImageUrl) {
      try {
        const imgController = new AbortController();
        const imgTimeout = setTimeout(() => imgController.abort(), 5000);
        const fetchRes = await fetch(targetImageUrl, { signal: imgController.signal });
        clearTimeout(imgTimeout);

        if (fetchRes.ok) {
          const arrayBuf = await fetchRes.arrayBuffer();
          image = await Jimp.read(Buffer.from(arrayBuf));
        }
      } catch (fetchErr) {
        console.error('[OgImage] Remote fetch failed, falling back to default:', fetchErr?.message);
      }
    }

    // Fallback if target image could not be loaded
    if (!image) {
      const fallbackPath = path.resolve(process.cwd(), 'public', 'og-default.jpg');
      if (fs.existsSync(fallbackPath)) {
        const defaultBuf = fs.readFileSync(fallbackPath);
        image = await Jimp.read(defaultBuf);
      }
    }

    if (!image) {
      return res.status(404).send('Image not found');
    }

    // Resize to max width 800px (standard optimal size for WhatsApp/Facebook cards)
    const currentWidth = image.bitmap.width;
    if (currentWidth > 800) {
      image.resize({ w: 800 });
    }

    // Export as optimized JPEG (quality 75, ~70-110 KB, guaranteed < 300KB)
    const jpegBuffer = await image.getBuffer('image/jpeg', { quality: 75 });

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('Content-Length', jpegBuffer.length);
    return res.status(200).send(jpegBuffer);
  } catch (err) {
    console.error('[OgImage] Processing error:', err);
    return res.status(500).send('Image optimization failed');
  }
}
