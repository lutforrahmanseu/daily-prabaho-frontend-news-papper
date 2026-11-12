/**
 * SEO & Structured Data Generation Utilities
 * Conforms to Google News, Schema.org NewsArticle, and BreadcrumbList specifications
 */

export const BASE_SITE_URL = 'https://dailyprabaho.com';
export const SITE_NAME = 'দৈনিক বার্তা প্রবাহ (Daily Prabaho)';

export function generateNewsArticleSchema(article, domain = BASE_SITE_URL) {
  if (!article) return null;

  const canonicalUrl = `${domain}/news/${article.slug}`;
  const imageUrl = article.image
    ? (article.image.startsWith('http') ? article.image : `${domain}${article.image.startsWith('/') ? '' : '/'}${article.image}`)
    : `${domain}/og-default.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${canonicalUrl}#article`,
    'headline': article.title || '',
    'description': article.excerpt || article.seoDescription || '',
    'image': [imageUrl],
    'datePublished': article.publishedAt || new Date().toISOString(),
    'dateModified': article.updatedAt || article.publishedAt || new Date().toISOString(),
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    'articleSection': article.categoryName || article.category || 'National',
    'inLanguage': 'bn',
    'author': {
      '@type': 'Person',
      'name': article.author || 'দৈনিক বার্তা প্রবাহ'
    },
    'publisher': {
      '@type': 'NewsMediaOrganization',
      'name': SITE_NAME,
      'url': domain,
      'logo': {
        '@type': 'ImageObject',
        'url': `${domain}/logo.png`,
        'width': 600,
        'height': 60
      }
    }
  };
}

export function generateBreadcrumbSchema(breadcrumbs, domain = BASE_SITE_URL) {
  if (!breadcrumbs || !Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((b, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': b.name,
      'item': b.url ? (b.url.startsWith('http') ? b.url : `${domain}${b.url.startsWith('/') ? '' : '/'}${b.url}`) : undefined
    }))
  };
}

export function buildCanonicalUrl(path, domain = BASE_SITE_URL) {
  if (!path) return `${domain}/`;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath.split('?')[0].split('#')[0]}`;
}

