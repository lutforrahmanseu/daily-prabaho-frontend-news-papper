import React, { useEffect } from 'react';

/**
 * Enterprise Production SEO & Structured Data Manager
 * - Updates document title, meta tags, OpenGraph, and Twitter Cards dynamically
 * - Injects dynamic Canonical Link tags (<link rel="canonical">)
 * - Injects Google News compliant NewsArticle JSON-LD schema
 * - Injects BreadcrumbList JSON-LD schema for rich SERP snippets
 */
export function SEO({
  title,
  description,
  image,
  url,
  article = false,
  publishedTime,
  modifiedTime,
  author,
  category,
  subcategory,
  tags = [],
  breadcrumbs = null,
  schema = null,
  noindex = false
}) {
  const siteName = 'দৈনিক বার্তা প্রবাহ (Daily Prabaho)';
  const siteDomain = 'https://dailyprabaho.com';
  const defaultDesc = 'বাংলাদেশ ও আন্তর্জাতিক বিশ্বের সর্বশেষ নির্ভরযোগ্য সংবাদ, রাজনীতি, বাণিজ্য, খেলাধুলা, বিজ্ঞান ও প্রযুক্তির সত্যনিষ্ঠ বিশ্লেষণ।';
  
  const finalTitle = title ? `${title} | ${siteName}` : siteName;
  const finalDesc = description || defaultDesc;
  
  // Resolve canonical and current URL
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : `${siteDomain}/`);
  const canonicalUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : `${siteDomain}/`);
  const finalImage = image ? (image.startsWith('http') ? image : `${siteDomain}${image.startsWith('/') ? '' : '/'}${image}`) : `${siteDomain}/og-default.jpg`;

  useEffect(() => {
    // 1. Set document title
    document.title = finalTitle;

    // 2. Helper to set or create meta tag
    const setMeta = (attributeName, attributeValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Set or update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 4. Basic Meta
    setMeta('name', 'description', finalDesc);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    if (tags && tags.length > 0) {
      setMeta('name', 'keywords', tags.join(', '));
    }

    // 5. OpenGraph Tags
    setMeta('property', 'og:site_name', siteName);
    setMeta('property', 'og:title', finalTitle);
    setMeta('property', 'og:description', finalDesc);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', article ? 'article' : 'website');
    setMeta('property', 'og:locale', 'bn_BD');
    setMeta('property', 'og:image', finalImage);
    setMeta('property', 'og:image:alt', title || siteName);

    // 6. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:site', '@dailyprabaho');
    setMeta('name', 'twitter:creator', '@dailyprabaho');
    setMeta('name', 'twitter:title', finalTitle);
    setMeta('name', 'twitter:description', finalDesc);
    setMeta('name', 'twitter:image', finalImage);

    // 7. Article specific OpenGraph properties
    if (article) {
      if (publishedTime) setMeta('property', 'article:published_time', publishedTime);
      if (modifiedTime) setMeta('property', 'article:modified_time', modifiedTime);
      if (author) setMeta('property', 'article:author', author);
      if (category) setMeta('property', 'article:section', category);
      if (tags && tags.length > 0) {
        tags.forEach(t => setMeta('property', 'article:tag', t));
      }
    }

    // 8. Inject Structured Data JSON-LD
    let scriptTag = document.getElementById('seo-jsonld-schema');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'seo-jsonld-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (schema) {
      scriptTag.text = JSON.stringify(schema);
    } else {
      // Build structured graph
      const graph = [];

      // Organization Schema
      const orgSchema = {
        '@type': 'NewsMediaOrganization',
        '@id': `${siteDomain}/#organization`,
        'name': siteName,
        'url': siteDomain,
        'logo': {
          '@type': 'ImageObject',
          'url': `${siteDomain}/logo.png`,
          'width': 600,
          'height': 60
        },
        'sameAs': [
          'https://facebook.com/dailyprabaho',
          'https://twitter.com/dailyprabaho',
          'https://youtube.com/@dailyprabaho'
        ]
      };
      graph.push(orgSchema);

      // WebSite Schema
      const websiteSchema = {
        '@type': 'WebSite',
        '@id': `${siteDomain}/#website`,
        'url': siteDomain,
        'name': siteName,
        'publisher': { '@id': `${siteDomain}/#organization` },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${siteDomain}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
      graph.push(websiteSchema);

      // NewsArticle Schema
      if (article) {
        const articleSchema = {
          '@type': 'NewsArticle',
          '@id': `${canonicalUrl}#article`,
          'isPartOf': { '@id': `${siteDomain}/#website` },
          'headline': title || '',
          'description': finalDesc,
          'image': [finalImage],
          'datePublished': publishedTime || new Date().toISOString(),
          'dateModified': modifiedTime || publishedTime || new Date().toISOString(),
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': canonicalUrl
          },
          'articleSection': category || 'National',
          'inLanguage': 'bn',
          'author': {
            '@type': 'Person',
            'name': author || 'দৈনিক বার্তা প্রবাহ'
          },
          'publisher': {
            '@id': `${siteDomain}/#organization`
          }
        };
        if (tags && tags.length > 0) {
          articleSchema.keywords = tags.join(', ');
        }
        graph.push(articleSchema);
      }

      // BreadcrumbList Schema
      let breadcrumbItems = [];
      if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
        breadcrumbItems = breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'name': b.name,
          'item': b.url ? (b.url.startsWith('http') ? b.url : `${siteDomain}${b.url}`) : undefined
        }));
      } else if (article && category) {
        breadcrumbItems = [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'প্রচ্ছদ',
            'item': `${siteDomain}/`
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': category,
            'item': `${siteDomain}/category/${category.toLowerCase()}`
          }
        ];
        if (subcategory) {
          breadcrumbItems.push({
            '@type': 'ListItem',
            'position': 3,
            'name': subcategory,
            'item': `${siteDomain}/category/${category.toLowerCase()}/${subcategory.toLowerCase()}`
          });
          breadcrumbItems.push({
            '@type': 'ListItem',
            'position': 4,
            'name': title,
            'item': canonicalUrl
          });
        } else {
          breadcrumbItems.push({
            '@type': 'ListItem',
            'position': 3,
            'name': title,
            'item': canonicalUrl
          });
        }
      }

      if (breadcrumbItems.length > 0) {
        graph.push({
          '@type': 'BreadcrumbList',
          '@id': `${canonicalUrl}#breadcrumb`,
          'itemListElement': breadcrumbItems
        });
      }

      const structuredData = {
        '@context': 'https://schema.org',
        '@graph': graph
      };

      scriptTag.text = JSON.stringify(structuredData);
    }
  }, [finalTitle, finalDesc, currentUrl, canonicalUrl, finalImage, article, publishedTime, modifiedTime, author, category, subcategory, tags, breadcrumbs, schema, noindex]);

  return null;
}

export default SEO;
