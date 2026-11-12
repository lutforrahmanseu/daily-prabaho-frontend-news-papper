import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_NEWS } from '../src/data/sampleNews.js';
import { CATEGORIES } from '../src/data/categories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://dailyprabaho.com';
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// 1. Generate XML Sitemap (General)
export function generateGeneralSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += `    <changefreq>hourly</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Categories
  CATEGORIES.forEach((cat) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/category/${cat.slug}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>hourly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;

    if (cat.subcategories && Array.isArray(cat.subcategories)) {
      cat.subcategories.forEach((sub) => {
        const subSlug = typeof sub === 'string' ? sub.toLowerCase().replace(/\s+/g, '-') : sub.slug;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/category/${cat.slug}/${subSlug}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      });
    }
  });

  // News Articles
  INITIAL_NEWS.forEach((art) => {
    const pubDate = art.publishedAt ? art.publishedAt.split('T')[0] : currentDate;
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/news/${art.slug}</loc>\n`;
    xml += `    <lastmod>${pubDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    if (art.image) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(art.image)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(art.title)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;
  return xml;
}

// 2. Generate Google News XML Sitemap
export function generateNewsSitemap() {
  const publishedArticles = INITIAL_NEWS.filter(a => a.status === 'published' || !a.status);
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

  publishedArticles.forEach((art) => {
    const dateFormatted = art.publishedAt ? new Date(art.publishedAt).toISOString() : new Date().toISOString();
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/news/${art.slug}</loc>\n`;
    xml += `    <news:news>\n`;
    xml += `      <news:publication>\n`;
    xml += `        <news:name>দৈনিক বার্তা প্রবাহ</news:name>\n`;
    xml += `        <news:language>bn</news:language>\n`;
    xml += `      </news:publication>\n`;
    xml += `      <news:publication_date>${dateFormatted}</news:publication_date>\n`;
    xml += `      <news:title>${escapeXml(art.title)}</news:title>\n`;
    xml += `    </news:news>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;
  return xml;
}

// Execute when run directly
const sitemapXml = generateGeneralSitemap();
const newsSitemapXml = generateNewsSitemap();

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'sitemap-news.xml'), newsSitemapXml, 'utf-8');

console.log('Successfully generated public/sitemap.xml and public/sitemap-news.xml');

