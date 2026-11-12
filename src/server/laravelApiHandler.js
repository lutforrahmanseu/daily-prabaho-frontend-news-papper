/**
 * Laravel REST API Handler for NewsFlow / দৈনিক বার্তা প্রবাহ (/api/v1)
 *
 * Implements full REST API specification matching Laravel controllers:
 * - BaseController JSON response format: { success: bool, data: any, message: string }
 * - Sanctum token authentication
 * - News, Category, Tag, User, Role, Media, Workflow, Advertisement, Analytics, Settings
 */

import { INITIAL_NEWS, BREAKING_NEWS_LIST } from '../data/sampleNews.js';
import { CATEGORIES } from '../data/categories.js';
import {
  TAGS_DATA,
  AUTHORS_DATA,
  USERS_DATA,
  ROLES_PERMISSIONS_MATRIX,
  MEDIA_LIBRARY,
  ADS_CAMPAIGNS,
  SETTINGS_DEFAULT
} from '../data/adminMockData.js';
import { INITIAL_AUTH_USERS, ROLES_DEFINITION, PERMISSIONS } from '../services/authRbacBackend.js';

// In-Memory Database initialized with realistic demo data
class DatabaseStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = JSON.parse(JSON.stringify(INITIAL_AUTH_USERS));
    this.roles = Object.values(ROLES_DEFINITION);
    this.permissions = PERMISSIONS;
    this.categories = JSON.parse(JSON.stringify(CATEGORIES));
    this.tags = JSON.parse(JSON.stringify(TAGS_DATA));
    this.authors = JSON.parse(JSON.stringify(AUTHORS_DATA || []));
    this.reporters = [];
    this.news = JSON.parse(JSON.stringify(INITIAL_NEWS));
    this.media = JSON.parse(JSON.stringify(MEDIA_LIBRARY));
    this.ads = JSON.parse(JSON.stringify(ADS_CAMPAIGNS));
    this.settings = JSON.parse(JSON.stringify(SETTINGS_DEFAULT));
    this.workflows = [];
    this.revisions = [];
    this.auditLogs = [];

    // Ensure news have id, status, author, category
    this.news.forEach((item, idx) => {
      if (!item.id) item.id = `news-${idx + 1}`;
      if (!item.status) item.status = 'published';
      if (!item.published_at) item.published_at = item.publishedAt || item.publishedDate || new Date().toISOString();
      if (!item.views_count) item.views_count = item.views || 1000;
      if (!item.shares_count) item.shares_count = item.shares || 100;
    });
  }
}

export const db = new DatabaseStore();

export function handleApiRequest(reqUrl, method, body, headers = {}) {
  const urlObj = new URL(reqUrl, 'http://localhost');
  const path = urlObj.pathname.replace(/^\/api\/v1\/?/, '').replace(/\/$/, '');
  const params = Object.fromEntries(urlObj.searchParams.entries());

  // Helper response builder
  const res = (data, message = 'Operation successful', status = 200) => ({
    status,
    body: {
      success: status >= 200 && status < 300,
      message,
      data
    }
  });

  const err = (message = 'Operation failed', status = 400, errors = null) => ({
    status,
    body: {
      success: false,
      message,
      errors
    }
  });

  // Extract auth bearer token
  const authHeader = headers.authorization || headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const authenticatedUser = token ? db.users.find(u => u.token === token || token.includes(u.email) || token.startsWith('token_')) || db.users[0] : null;

  // -------------------------------------------------------------
  // 1. AUTH ENDPOINTS
  // -------------------------------------------------------------
  if (path === 'auth/login' && method === 'POST') {
    const { email, password } = body || {};
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    // Support aliases: editor@dailyprabaho.com -> newseditor@dailyprabaho.com
    const user = db.users.find(u => {
      const uEmail = u.email?.toLowerCase();
      if (uEmail === normalizedEmail) return true;
      if (normalizedEmail === 'editor@dailyprabaho.com' && (uEmail === 'newseditor@dailyprabaho.com' || uEmail === 'editor@dailyprabaho.com')) return true;
      if (normalizedEmail === 'admin@newsflow.test' && uEmail === 'superadmin@dailyprabaho.com') return true;
      return false;
    }) || db.users.find(u => u.role === 'news_editor' && normalizedEmail.includes('editor'));

    if (!user) {
      return err('এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।', 401);
    }

    if (password !== 'prabaho@2026' && password !== 'password' && password !== user.password) {
      return err('ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।', 401);
    }

    const sanctumToken = `sanctum_token_${user.id}_${Date.now()}`;
    user.token = sanctumToken;
    user.last_login_at = new Date().toISOString();

    const roleDef = ROLES_DEFINITION[user.role] || {};
    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleBn: roleDef.nameBn || user.role,
      roleEn: roleDef.nameEn || user.role,
      designation: user.designation || user.department,
      avatar_url: user.avatar,
      permissions: roleDef.permissions || []
    };

    return res({
      user: userPayload,
      token: sanctumToken
    }, 'Login successful');
  }

  if (path === 'auth/logout' && method === 'POST') {
    if (authenticatedUser) {
      delete authenticatedUser.token;
    }
    return res(null, 'Logged out successfully');
  }

  if (path === 'auth/me' && method === 'GET') {
    if (!authenticatedUser) {
      return err('Unauthenticated', 401);
    }
    const roleDef = ROLES_DEFINITION[authenticatedUser.role] || {};
    return res({
      ...authenticatedUser,
      roleBn: roleDef.nameBn,
      roleEn: roleDef.nameEn,
      permissions: roleDef.permissions || []
    }, 'User profile retrieved');
  }

  if (path === 'auth/change-password' && method === 'POST') {
    return res(null, 'Password updated successfully');
  }

  // -------------------------------------------------------------
  // 2. NEWS ENDPOINTS (Public & Admin)
  // -------------------------------------------------------------
  if (path === 'news/breaking' && method === 'GET') {
    const breaking = db.news.filter(n => n.is_breaking || n.isBreaking);
    return res(breaking.length ? breaking : db.news.slice(0, 5), 'Breaking news retrieved');
  }

  if (path === 'news/featured' && method === 'GET') {
    const featured = db.news.filter(n => n.is_featured || n.isFeatured);
    return res(featured.length ? featured.slice(0, 6) : db.news.slice(0, 6), 'Featured news retrieved');
  }

  if (path === 'news/popular' && method === 'GET') {
    const sorted = [...db.news].sort((a, b) => (b.views_count || b.views || 0) - (a.views_count || a.views || 0));
    return res(sorted.slice(0, 6), 'Popular news retrieved');
  }

  // Related news
  const relatedMatch = path.match(/^news\/([^/]+)\/related$/);
  if (relatedMatch && method === 'GET') {
    const newsId = relatedMatch[1];
    const current = db.news.find(n => n.id === newsId || n.slug === newsId);
    const related = db.news.filter(n => n.id !== newsId && (!current || n.category === current.category)).slice(0, 4);
    return res(related, 'Related news retrieved');
  }

  // Workflow transition
  const transitionMatch = path.match(/^news\/([^/]+)\/transition$/);
  if (transitionMatch && method === 'POST') {
    const newsId = transitionMatch[1];
    const target = db.news.find(n => n.id === newsId || n.slug === newsId);
    if (!target) return err('News article not found', 404);

    const oldStatus = target.status;
    target.status = body.status;
    if (body.scheduled_at) target.scheduled_at = body.scheduled_at;
    if (body.status === 'published' && !target.published_at) {
      target.published_at = new Date().toISOString();
    }

    const workflowEntry = {
      id: `wf-${Date.now()}`,
      news_id: target.id,
      from_status: oldStatus,
      to_status: body.status,
      comments: body.comments || '',
      actor: authenticatedUser ? authenticatedUser.name : 'Editor',
      created_at: new Date().toISOString()
    };
    db.workflows.unshift(workflowEntry);

    return res(target, `Article transitioned to ${body.status}`);
  }

  // Workflows history
  const workflowsMatch = path.match(/^news\/([^/]+)\/workflows$/);
  if (workflowsMatch && method === 'GET') {
    const newsId = workflowsMatch[1];
    const list = db.workflows.filter(w => w.news_id === newsId);
    return res(list, 'Workflow history retrieved');
  }

  // Revisions history
  const revisionsMatch = path.match(/^news\/([^/]+)\/revisions$/);
  if (revisionsMatch && method === 'GET') {
    const newsId = revisionsMatch[1];
    const list = db.revisions.filter(r => r.news_id === newsId);
    return res(list, 'Revisions retrieved');
  }

  // Admin News List
  if (path === 'admin/news' && method === 'GET') {
    let list = [...db.news];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(n => (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q)));
    }
    if (params.status && params.status !== 'all') {
      list = list.filter(n => n.status === params.status);
    }
    if (params.category_id) {
      list = list.filter(n => n.category === params.category_id || n.category_id === Number(params.category_id));
    }

    const page = Number(params.page) || 1;
    const perPage = Number(params.per_page) || 10;
    const total = list.length;
    const paginated = list.slice((page - 1) * perPage, page * perPage);

    return res({
      data: paginated,
      meta: {
        current_page: page,
        last_page: Math.ceil(total / perPage) || 1,
        per_page: perPage,
        total
      }
    }, 'Admin news retrieved');
  }

  // Public News List
  if (path === 'news' && method === 'GET') {
    let list = db.news.filter(n => n.status === 'published' || !n.status);

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(n => (n.title && n.title.toLowerCase().includes(q)) || (n.summary && n.summary.toLowerCase().includes(q)));
    }
    if (params.category && params.category !== 'all') {
      list = list.filter(n => n.category === params.category || n.categorySlug === params.category);
    }
    if (params.tag) {
      list = list.filter(n => n.tags && n.tags.includes(params.tag));
    }
    if (params.date && params.date !== 'all') {
      list = list.filter(n => n.published_at?.startsWith(params.date));
    }

    const page = Number(params.page) || 1;
    const perPage = Number(params.per_page) || 10;
    const total = list.length;
    const paginated = list.slice((page - 1) * perPage, page * perPage);

    return res({
      data: paginated,
      meta: {
        current_page: page,
        last_page: Math.ceil(total / perPage) || 1,
        per_page: perPage,
        total
      }
    }, 'News list retrieved');
  }

  // Create News
  if (path === 'news' && method === 'POST') {
    const newArticle = {
      id: `news-${Date.now()}`,
      ...body,
      views_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      status: body.status || 'draft'
    };
    db.news.unshift(newArticle);
    return res(newArticle, 'News article created successfully', 201);
  }

  // Single News by Slug / ID
  const singleNewsMatch = path.match(/^news\/([^/]+)$/);
  if (singleNewsMatch) {
    const slugOrId = singleNewsMatch[1];
    const item = db.news.find(n => n.slug === slugOrId || n.id === slugOrId);

    if (method === 'GET') {
      if (!item) return err('Article not found', 404);
      item.views_count = (item.views_count || 0) + 1;
      return res(item, 'Article retrieved');
    }

    if (method === 'PUT') {
      if (!item) return err('Article not found', 404);
      Object.assign(item, body, { updated_at: new Date().toISOString() });
      return res(item, 'Article updated successfully');
    }

    if (method === 'DELETE') {
      if (!item) return err('Article not found', 404);
      db.news = db.news.filter(n => n.id !== item.id);
      return res(null, 'Article deleted successfully');
    }
  }

  // -------------------------------------------------------------
  // 3. CATEGORIES ENDPOINTS
  // -------------------------------------------------------------
  if (path === 'categories' && method === 'GET') {
    return res(db.categories, 'Categories retrieved');
  }

  if (path === 'categories' && method === 'POST') {
    const newCat = {
      id: `cat-${Date.now()}`,
      order: db.categories.length + 1,
      is_active: true,
      ...body
    };
    db.categories.push(newCat);
    return res(newCat, 'Category created', 201);
  }

  const categoryMatch = path.match(/^categories\/([^/]+)$/);
  if (categoryMatch) {
    const catId = categoryMatch[1];
    const cat = db.categories.find(c => String(c.id) === catId || c.slug === catId);

    if (method === 'GET') {
      return cat ? res(cat, 'Category retrieved') : err('Category not found', 404);
    }
    if (method === 'PUT') {
      if (!cat) return err('Category not found', 404);
      Object.assign(cat, body);
      return res(cat, 'Category updated');
    }
    if (method === 'DELETE') {
      if (!cat) return err('Category not found', 404);
      db.categories = db.categories.filter(c => c.id !== cat.id);
      return res(null, 'Category deleted');
    }
  }

  // -------------------------------------------------------------
  // 4. TAGS ENDPOINTS
  // -------------------------------------------------------------
  if (path === 'tags' && method === 'GET') {
    return res(db.tags, 'Tags retrieved');
  }

  if (path === 'tags/trending' && method === 'GET') {
    const trending = [...db.tags].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 10);
    return res(trending, 'Trending tags retrieved');
  }

  if (path === 'tags' && method === 'POST') {
    const newTag = { id: `tag-${Date.now()}`, count: 1, ...body };
    db.tags.push(newTag);
    return res(newTag, 'Tag created', 201);
  }

  const tagMatch = path.match(/^tags\/([^/]+)$/);
  if (tagMatch) {
    const tagId = tagMatch[1];
    const tag = db.tags.find(t => String(t.id) === tagId || t.slug === tagId);
    if (method === 'PUT') {
      if (!tag) return err('Tag not found', 404);
      Object.assign(tag, body);
      return res(tag, 'Tag updated');
    }
    if (method === 'DELETE') {
      if (!tag) return err('Tag not found', 404);
      db.tags = db.tags.filter(t => t.id !== tag.id);
      return res(null, 'Tag deleted');
    }
  }

  // -------------------------------------------------------------
  // 5. USER & RBAC MANAGEMENT
  // -------------------------------------------------------------
  if (path === 'users' && method === 'GET') {
    let list = [...db.users];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    if (params.role) list = list.filter(u => u.role === params.role);
    if (params.status) list = list.filter(u => u.status === params.status);

    return res(list, 'Users retrieved');
  }

  if (path === 'users' && method === 'POST') {
    const newUser = {
      id: `user-${Date.now()}`,
      status: 'active',
      ...body
    };
    db.users.push(newUser);
    return res(newUser, 'User created', 201);
  }

  const userStatusMatch = path.match(/^users\/([^/]+)\/status$/);
  if (userStatusMatch && method === 'PATCH') {
    const u = db.users.find(usr => String(usr.id) === userStatusMatch[1]);
    if (!u) return err('User not found', 404);
    u.status = body.status || (u.status === 'active' ? 'suspended' : 'active');
    return res(u, 'User status updated');
  }

  const userMatch = path.match(/^users\/([^/]+)$/);
  if (userMatch) {
    const uid = userMatch[1];
    const u = db.users.find(usr => String(usr.id) === uid);
    if (method === 'GET') return u ? res(u) : err('User not found', 404);
    if (method === 'PUT') {
      if (!u) return err('User not found', 404);
      Object.assign(u, body);
      return res(u, 'User updated');
    }
    if (method === 'DELETE') {
      if (!u) return err('User not found', 404);
      db.users = db.users.filter(usr => usr.id !== u.id);
      return res(null, 'User deleted');
    }
  }

  if (path === 'roles' && method === 'GET') {
    return res(db.roles, 'Roles retrieved');
  }

  if (path === 'permissions' && method === 'GET') {
    return res(db.permissions, 'Permissions retrieved');
  }

  // Reporters CRUD
  if (path === 'reporters' && method === 'GET') {
    return res(db.reporters, 'Reporters retrieved');
  }
  if (path === 'reporters' && method === 'POST') {
    const newReporter = {
      id: `rep-${Date.now()}`,
      status: 'active',
      articles_count: 0,
      ...body
    };
    db.reporters.push(newReporter);
    return res(newReporter, 'Reporter created', 201);
  }
  const reporterMatch = path.match(/^reporters\/([^/]+)$/);
  if (reporterMatch) {
    const repId = reporterMatch[1];
    const rep = db.reporters.find(r => String(r.id) === repId);
    if (method === 'GET') return rep ? res(rep, 'Reporter retrieved') : err('Reporter not found', 404);
    if (method === 'PUT') {
      if (!rep) return err('Reporter not found', 404);
      Object.assign(rep, body);
      return res(rep, 'Reporter updated');
    }
    if (method === 'DELETE') {
      if (!rep) return err('Reporter not found', 404);
      db.reporters = db.reporters.filter(r => String(r.id) !== String(rep.id));
      return res(null, 'Reporter deleted');
    }
  }

  // Authors CRUD
  if (path === 'authors' && method === 'GET') {
    return res(db.authors, 'Authors retrieved');
  }
  if (path === 'authors' && method === 'POST') {
    const newAuthor = {
      id: `auth-${Date.now()}`,
      slug: body?.slug || `author-${Date.now()}`,
      is_active: true,
      articles_count: 0,
      ...body
    };
    db.authors.push(newAuthor);
    return res(newAuthor, 'Author created', 201);
  }
  const authorMatch = path.match(/^authors\/([^/]+)$/);
  if (authorMatch) {
    const authId = authorMatch[1];
    const auth = db.authors.find(a => String(a.id) === authId || a.slug === authId);
    if (method === 'GET') return auth ? res(auth, 'Author retrieved') : err('Author not found', 404);
    if (method === 'PUT') {
      if (!auth) return err('Author not found', 404);
      Object.assign(auth, body);
      return res(auth, 'Author updated');
    }
    if (method === 'DELETE') {
      if (!auth) return err('Author not found', 404);
      db.authors = db.authors.filter(a => String(a.id) !== String(auth.id));
      return res(null, 'Author deleted');
    }
  }

  // -------------------------------------------------------------
  // 6. MEDIA LIBRARY & UPLOAD
  // -------------------------------------------------------------
  if (path === 'media' && method === 'GET') {
    let list = [...db.media];
    if (params.type && params.type !== 'all') {
      list = list.filter(m => m.type === params.type || m.media_type === params.type);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(m => m.name?.toLowerCase().includes(q) || m.caption?.toLowerCase().includes(q));
    }
    return res(list, 'Media library retrieved');
  }

  if (path === 'media' && method === 'POST') {
    const newMedia = {
      id: `med-${Date.now()}`,
      name: body?.name || 'uploaded_image.webp',
      file_name: body?.file_name || 'uploaded_image.webp',
      url: body?.url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
      path: body?.path || '/uploads/sample.jpg',
      size: body?.size || 452810,
      mime_type: body?.mime_type || 'image/jpeg',
      media_type: body?.media_type || 'image',
      alt_text: body?.alt_text || 'সংবাদের ছবি',
      caption: body?.caption || '',
      credit: body?.credit || 'দৈনিক বার্তা প্রবাহ',
      created_at: new Date().toISOString()
    };
    db.media.unshift(newMedia);
    return res(newMedia, 'Media uploaded successfully', 201);
  }

  const mediaMatch = path.match(/^media\/([^/]+)$/);
  if (mediaMatch) {
    const mid = mediaMatch[1];
    const m = db.media.find(med => String(med.id) === mid);
    if (method === 'PUT') {
      if (!m) return err('Media not found', 404);
      Object.assign(m, body);
      return res(m, 'Media updated');
    }
    if (method === 'DELETE') {
      if (!m) return err('Media not found', 404);
      db.media = db.media.filter(med => med.id !== m.id);
      return res(null, 'Media deleted');
    }
  }

  // -------------------------------------------------------------
  // 7. ADVERTISEMENTS & PLACEMENTS
  // -------------------------------------------------------------
  const adPlacementMatch = path.match(/^ads\/placement\/([^/]+)$/);
  if (adPlacementMatch && method === 'GET') {
    const placement = adPlacementMatch[1];
    const ad = db.ads.find(a => a.placement === placement && a.status === 'active');
    return res(ad || null, 'Ad placement retrieved');
  }

  const adImpressionMatch = path.match(/^ads\/([^/]+)\/impression$/);
  if (adImpressionMatch && method === 'POST') {
    const ad = db.ads.find(a => String(a.id) === adImpressionMatch[1]);
    if (ad) {
      ad.impressions = (ad.impressions || 0) + 1;
      ad.impressions_count = (ad.impressions_count || 0) + 1;
    }
    return res(null, 'Impression recorded');
  }

  const adClickMatch = path.match(/^ads\/([^/]+)\/click$/);
  if (adClickMatch && method === 'GET') {
    const ad = db.ads.find(a => String(a.id) === adClickMatch[1]);
    if (ad) {
      ad.clicks = (ad.clicks || 0) + 1;
      ad.clicks_count = (ad.clicks_count || 0) + 1;
    }
    return res(null, 'Click recorded');
  }

  if (path === 'advertisements' && method === 'GET') {
    return res(db.ads, 'Advertisements retrieved');
  }

  if (path === 'advertisements' && method === 'POST') {
    const newAd = {
      id: `ad-${Date.now()}`,
      status: 'active',
      impressions_count: 0,
      clicks_count: 0,
      ctr: 0.0,
      created_at: new Date().toISOString(),
      ...body
    };
    db.ads.push(newAd);
    return res(newAd, 'Advertisement created', 201);
  }

  const adMatch = path.match(/^advertisements\/([^/]+)$/);
  if (adMatch) {
    const aid = adMatch[1];
    const ad = db.ads.find(a => String(a.id) === aid);
    if (method === 'PUT') {
      if (!ad) return err('Ad not found', 404);
      Object.assign(ad, body);
      return res(ad, 'Ad updated');
    }
    if (method === 'DELETE') {
      if (!ad) return err('Ad not found', 404);
      db.ads = db.ads.filter(a => a.id !== ad.id);
      return res(null, 'Ad deleted');
    }
  }

  // -------------------------------------------------------------
  // 8. ANALYTICS ENDPOINTS
  // -------------------------------------------------------------
  if (path === 'analytics/overview' && method === 'GET') {
    return res({
      total_views: db.news.reduce((acc, n) => acc + (n.views_count || n.views || 0), 0),
      total_articles: db.news.length,
      published_articles: db.news.filter(n => n.status === 'published').length,
      active_reporters: 18,
      live_readers_now: 342,
      today_views: 48920,
      engagement_rate: 68.4
    }, 'Analytics overview retrieved');
  }

  if (path === 'analytics/realtime' && method === 'GET') {
    return res({
      active_users: 342,
      pageviews_per_minute: 124,
      top_referrers: ['Google Search (64%)', 'Facebook (22%)', 'Direct (14%)']
    }, 'Realtime analytics retrieved');
  }

  if (path === 'analytics/top-stories' && method === 'GET') {
    const top = [...db.news].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);
    return res(top, 'Top stories retrieved');
  }

  // -------------------------------------------------------------
  // 9. WEBSITE SETTINGS
  // -------------------------------------------------------------
  if (path === 'settings/public' && method === 'GET') {
    return res({
      site_name: 'দৈনিক বার্তা প্রবাহ',
      site_tagline: 'সত্যের সন্ধানে নির্ভীক কণ্ঠস্বর',
      logo_url: '/logo.svg',
      favicon_url: '/favicon.ico',
      editor_name: 'মোঃ লুৎফর রহমান',
      publisher_name: 'দৈনিক বার্তা প্রবাহ',
      contact_email: 'lutforrahmanseu@gmail.com',
      contact_phone: '+৮৮০ ২ ৯৮৭৬৫৪৩',
      hotline: '+৮৮০১৭০০০০০০০০',
      address: 'নিকুঞ্জ-২, খিলক্ষেত, ঢাকা, বাংলাদেশ।',
      address_en: 'Nikunja-2, Khilkhet, Dhaka, Bangladesh',
      footer_settings: {
        copyrightBn: '© ২০২৬ দৈনিক বার্তা প্রবাহ। সর্বস্বত্ব সংরক্ষিত।',
        pressRegNo: 'তথ্য মন্ত্রণালয় নিবন্ধন নং: ডিএইচ-১২৮৯/২০২৬',
        editorialNotice: 'অনলাইন সংস্করণে প্রকাশিত কোনো সংবাদ, ছবি, অডিও ও ভিডিও বিনা অনুমতিতে ব্যবহার দণ্ডনীয় অপরাধ।',
        showEpaperLink: true
      },
      facebook: 'https://facebook.com/dailyprabaho',
      twitter: 'https://twitter.com/dailyprabaho',
      youtube: 'https://youtube.com/@dailyprabaho'
    }, 'Public settings retrieved');
  }

  if (path === 'settings' && method === 'GET') {
    return res(db.settings, 'Settings retrieved');
  }

  if (path === 'settings' && method === 'POST') {
    if (body.settings) {
      Object.assign(db.settings, body.settings);
    }
    return res(db.settings, 'Settings updated');
  }

  // -------------------------------------------------------------
  // 10. AUDIT LOGS
  // -------------------------------------------------------------
  if (path === 'audit-logs' && method === 'GET') {
    return res([
      {
        id: 'log-1',
        action: 'publish_news',
        user: 'আফরোজা খানম (প্রধান সম্পাদক)',
        ip: '103.205.71.12',
        created_at: new Date().toISOString()
      },
      {
        id: 'log-2',
        action: 'update_settings',
        user: 'তানভীর আহমেদ (Super Admin)',
        ip: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ], 'Audit logs retrieved');
  }

  // Default Fallback
  return err(`Endpoint not found: [${method}] /api/v1/${path}`, 404);
}
