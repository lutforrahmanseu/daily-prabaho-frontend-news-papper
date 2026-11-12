import { test } from 'node:test';
import assert from 'node:assert';
import { handleApiRequest, db } from '../../server/laravelApiHandler.js';

// Test wrapper simulating real client-side fetch calls against the Laravel API endpoints
async function simulateClientRequest(endpoint, { method = 'GET', body = null, token = null, params = {} } = {}) {
  let url = `http://localhost/api/v1/${endpoint.replace(/^\//, '')}`;
  const queryParts = [];
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  }
  if (queryParts.length > 0) {
    url += (url.includes('?') ? '&' : '?') + queryParts.join('&');
  }

  const headers = {
    'Accept': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = handleApiRequest(url, method, body, headers);
  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    body: response.body,
    data: response.body?.data
  };
}

test('API Integration: reset database store', () => {
  db.reset();
  assert.ok(db.news.length > 0);
  assert.ok(db.users.length > 0);
  assert.ok(db.categories.length > 0);
});

// 1. authApi integration tests
test('API Integration: authApi - login authentication, me, and logout', async () => {
  // Test invalid login
  const invalidRes = await simulateClientRequest('auth/login', {
    method: 'POST',
    body: { email: 'wrong@example.com', password: 'badpassword' }
  });
  assert.strictEqual(invalidRes.status, 401);
  assert.strictEqual(invalidRes.body.success, false);

  // Test valid login
  const loginRes = await simulateClientRequest('auth/login', {
    method: 'POST',
    body: { email: 'newseditor@dailyprabaho.com', password: 'prabaho@2026' }
  });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.success, true);
  assert.ok(loginRes.data.token.startsWith('sanctum_token_'));
  assert.strictEqual(loginRes.data.user.email, 'newseditor@dailyprabaho.com');
  assert.ok(Array.isArray(loginRes.data.user.permissions));
  assert.ok(loginRes.data.user.permissions.includes('news.review'));

  const token = loginRes.data.token;

  // Test getMe authenticated endpoint
  const meRes = await simulateClientRequest('auth/me', { token });
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.data.email, 'newseditor@dailyprabaho.com');

  // Test logout
  const logoutRes = await simulateClientRequest('auth/logout', { method: 'POST', token });
  assert.strictEqual(logoutRes.status, 200);
  assert.strictEqual(logoutRes.body.success, true);
});

// 2. newsApi integration tests
test('API Integration: newsApi - public news list with search and pagination', async () => {
  const listRes = await simulateClientRequest('news', {
    params: { page: 1, per_page: 5, search: 'মেট্রোরেল' }
  });
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data.data));
  assert.strictEqual(listRes.data.meta.per_page, 5);

  // Category filter
  const catRes = await simulateClientRequest('news', {
    params: { category: 'sports' }
  });
  assert.strictEqual(catRes.status, 200);

  // Breaking news
  const breakingRes = await simulateClientRequest('news/breaking');
  assert.strictEqual(breakingRes.status, 200);
  assert.ok(Array.isArray(breakingRes.data));

  // Featured news
  const featuredRes = await simulateClientRequest('news/featured');
  assert.strictEqual(featuredRes.status, 200);
  assert.ok(Array.isArray(featuredRes.data));

  // Popular news
  const popularRes = await simulateClientRequest('news/popular');
  assert.strictEqual(popularRes.status, 200);
  assert.ok(Array.isArray(popularRes.data));
});

test('API Integration: newsApi - admin news list, CRUD operations', async () => {
  // Admin list
  const adminList = await simulateClientRequest('admin/news', {
    params: { status: 'published', page: 1, per_page: 10 }
  });
  assert.strictEqual(adminList.status, 200);
  assert.ok(Array.isArray(adminList.data.data));

  // Create article
  const createRes = await simulateClientRequest('news', {
    method: 'POST',
    body: {
      title: 'জাতীয় বাজেট ২০২৬-২৭: শিক্ষা ও স্বাস্থ্য খাতে সর্বোচ্চ বরাদ্দ প্রস্তাব',
      slug: 'national-budget-2026-27-education-health-priority',
      summary: 'চলতি অর্থবছরে শিক্ষা ও স্বাস্থ্য খাতের গুণগত মানোন্নয়নে বিশেষ বরাদ্দ রাখা হয়েছে।',
      content: '<p>জাতীয় সংসদে আজ নতুন অর্থবছরের বাজেট উপস্থাপন করা হয়েছে...</p>',
      category: 'economy',
      status: 'draft'
    }
  });
  assert.strictEqual(createRes.status, 201);
  assert.ok(createRes.data.id);
  const createdId = createRes.data.id;

  // Read article by slug
  const readRes = await simulateClientRequest(`news/${createRes.data.slug}`);
  assert.strictEqual(readRes.status, 200);
  assert.strictEqual(readRes.data.id, createdId);

  // Update article
  const updateRes = await simulateClientRequest(`news/${createdId}`, {
    method: 'PUT',
    body: {
      title: 'জাতীয় বাজেট ২০২৬-২৭: শিক্ষা ও স্বাস্থ্য খাতে রেকর্ড বরাদ্দ প্রস্তাব'
    }
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.title, 'জাতীয় বাজেট ২০২৬-২৭: শিক্ষা ও স্বাস্থ্য খাতে রেকর্ড বরাদ্দ প্রস্তাব');

  // Related news
  const relatedRes = await simulateClientRequest(`news/${createdId}/related`);
  assert.strictEqual(relatedRes.status, 200);
  assert.ok(Array.isArray(relatedRes.data));

  // Delete article
  const delRes = await simulateClientRequest(`news/${createdId}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 200);

  // Verify deletion
  const verifyRes = await simulateClientRequest(`news/${createdId}`);
  assert.strictEqual(verifyRes.status, 404);
});

// 3. categoryApi integration tests
test('API Integration: categoryApi - CRUD operations', async () => {
  const listRes = await simulateClientRequest('categories');
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data));
  const initialCount = listRes.data.length;

  // Create
  const createRes = await simulateClientRequest('categories', {
    method: 'POST',
    body: { name: 'কৃষি ও খাদ্য', slug: 'agriculture-food' }
  });
  assert.strictEqual(createRes.status, 201);
  const catId = createRes.data.id;

  // Update
  const updateRes = await simulateClientRequest(`categories/${catId}`, {
    method: 'PUT',
    body: { name: 'কৃষি ও গ্রামীণ অর্থনীতি' }
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.name, 'কৃষি ও গ্রামীণ অর্থনীতি');

  // Delete
  const delRes = await simulateClientRequest(`categories/${catId}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 200);

  const finalList = await simulateClientRequest('categories');
  assert.strictEqual(finalList.data.length, initialCount);
});

// 4. tagApi integration tests
test('API Integration: tagApi - list, trending, and create', async () => {
  const listRes = await simulateClientRequest('tags');
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data));

  const trendingRes = await simulateClientRequest('tags/trending');
  assert.strictEqual(trendingRes.status, 200);
  assert.ok(Array.isArray(trendingRes.data));

  const createRes = await simulateClientRequest('tags', {
    method: 'POST',
    body: { name: 'ডিজিটাল বাংলাদেশ', slug: 'digital-bangladesh' }
  });
  assert.strictEqual(createRes.status, 201);
});

// 5. userApi integration tests
test('API Integration: userApi - list, search, and toggle status', async () => {
  const listRes = await simulateClientRequest('users', { params: { search: 'লুৎফর' } });
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data));

  const createRes = await simulateClientRequest('users', {
    method: 'POST',
    body: {
      name: 'ফারুক আহমেদ',
      email: 'faruk.reporter@dailyprabaho.com',
      role: 'reporter'
    }
  });
  assert.strictEqual(createRes.status, 201);
  const userId = createRes.data.id;

  const toggleRes = await simulateClientRequest(`users/${userId}/status`, {
    method: 'PATCH',
    body: { status: 'suspended' }
  });
  assert.strictEqual(toggleRes.status, 200);
  assert.strictEqual(toggleRes.data.status, 'suspended');

  const delRes = await simulateClientRequest(`users/${userId}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 200);
});

// 6. roleApi integration tests
test('API Integration: roleApi - get roles and permissions', async () => {
  const rolesRes = await simulateClientRequest('roles');
  assert.strictEqual(rolesRes.status, 200);
  assert.ok(Array.isArray(rolesRes.data));
  assert.ok(rolesRes.data.length >= 8);

  const permsRes = await simulateClientRequest('permissions');
  assert.strictEqual(permsRes.status, 200);
  assert.ok(Array.isArray(permsRes.data));
  assert.ok(permsRes.data.length >= 16);
});

// 7. mediaApi integration tests
test('API Integration: mediaApi - list, upload, update, delete', async () => {
  const listRes = await simulateClientRequest('media', { params: { type: 'image' } });
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data));

  const uploadRes = await simulateClientRequest('media', {
    method: 'POST',
    body: {
      name: 'parliament-session.webp',
      alt_text: 'জাতীয় সংসদ অধিবেশন',
      caption: 'স্পিকারের সভাপতিত্বে অধিবেশন চলমান',
      credit: 'বার্তা প্রবাহ ফটো'
    }
  });
  assert.strictEqual(uploadRes.status, 201);
  const mediaId = uploadRes.data.id;

  const updateRes = await simulateClientRequest(`media/${mediaId}`, {
    method: 'PUT',
    body: { alt_text: 'সংসদ অধিবেশনের দৃশ্য' }
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.alt_text, 'সংসদ অধিবেশনের দৃশ্য');

  const delRes = await simulateClientRequest(`media/${mediaId}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 200);
});

// 8. workflowApi integration tests
test('API Integration: workflowApi - state transitions and workflow history', async () => {
  const article = db.news[0];
  assert.ok(article);

  const transitionRes = await simulateClientRequest(`news/${article.id}/transition`, {
    method: 'POST',
    body: {
      status: 'under_review',
      comments: 'ভাষাগত সংশোধন ও তথ্য যাচাইয়ের জন্য জমা দেওয়া হলো।'
    }
  });
  assert.strictEqual(transitionRes.status, 200);
  assert.strictEqual(transitionRes.data.status, 'under_review');

  const historyRes = await simulateClientRequest(`news/${article.id}/workflows`);
  assert.strictEqual(historyRes.status, 200);
  assert.ok(Array.isArray(historyRes.data));
  assert.ok(historyRes.data.length > 0);
  assert.strictEqual(historyRes.data[0].to_status, 'under_review');
});

// 9. advertisementApi integration tests
test('API Integration: advertisementApi - placements and tracking', async () => {
  const adsRes = await simulateClientRequest('advertisements');
  assert.strictEqual(adsRes.status, 200);
  assert.ok(Array.isArray(adsRes.data));

  const slotRes = await simulateClientRequest('ads/placement/homepage_top');
  assert.strictEqual(slotRes.status, 200);

  if (slotRes.data?.id) {
    const adId = slotRes.data.id;
    const impRes = await simulateClientRequest(`ads/${adId}/impression`, { method: 'POST' });
    assert.strictEqual(impRes.status, 200);

    const clickRes = await simulateClientRequest(`ads/${adId}/click`);
    assert.strictEqual(clickRes.status, 200);
  }
});

// 10. analyticsApi integration tests
test('API Integration: analyticsApi - overview, realtime, and top stories', async () => {
  const overviewRes = await simulateClientRequest('analytics/overview');
  assert.strictEqual(overviewRes.status, 200);
  assert.ok(overviewRes.data.total_views > 0);
  assert.ok(overviewRes.data.total_articles > 0);

  const realtimeRes = await simulateClientRequest('analytics/realtime');
  assert.strictEqual(realtimeRes.status, 200);
  assert.ok(realtimeRes.data.active_users > 0);

  const topRes = await simulateClientRequest('analytics/top-stories');
  assert.strictEqual(topRes.status, 200);
  assert.ok(Array.isArray(topRes.data));
});

// 11. settingsApi integration tests
test('API Integration: settingsApi - public settings and update', async () => {
  const publicRes = await simulateClientRequest('settings/public');
  assert.strictEqual(publicRes.status, 200);
  assert.strictEqual(publicRes.data.site_name, 'দৈনিক বার্তা প্রবাহ');

  const allRes = await simulateClientRequest('settings');
  assert.strictEqual(allRes.status, 200);

  const updateRes = await simulateClientRequest('settings', {
    method: 'POST',
    body: {
      settings: { site_tagline: 'সত্য ও সাহসের প্রতিচ্ছবি' },
      group: 'general'
    }
  });
  assert.strictEqual(updateRes.status, 200);
});

// 12. Taxonomy & People CRUD tests (Category, Tag, Reporter, Author)
test('API Integration: Category, Tag, Reporter & Author Create/Update/Delete', async () => {
  db.reset();

  // Category CRUD
  const createCat = await simulateClientRequest('categories', {
    method: 'POST',
    body: { name: 'জলবায়ু', slug: 'climate-test', is_active: true }
  });
  assert.strictEqual(createCat.status, 201);
  const catId = createCat.data.id;

  const updateCat = await simulateClientRequest(`categories/${catId}`, {
    method: 'PUT',
    body: { name: 'জলবায়ু ও পরিবেশ', is_active: false }
  });
  assert.strictEqual(updateCat.status, 200);
  assert.strictEqual(updateCat.data.name, 'জলবায়ু ও পরিবেশ');
  assert.strictEqual(updateCat.data.is_active, false);

  const deleteCat = await simulateClientRequest(`categories/${catId}`, { method: 'DELETE' });
  assert.strictEqual(deleteCat.status, 200);

  // Tag CRUD
  const createTag = await simulateClientRequest('tags', {
    method: 'POST',
    body: { name: 'কৃত্রিম বুদ্ধিমত্তা', slug: 'ai-tech-test' }
  });
  assert.strictEqual(createTag.status, 201);
  const tagId = createTag.data.id;

  const updateTag = await simulateClientRequest(`tags/${tagId}`, {
    method: 'PUT',
    body: { name: 'এআই প্রযুক্তি', description: 'AI related news' }
  });
  assert.strictEqual(updateTag.status, 200);
  assert.strictEqual(updateTag.data.name, 'এআই প্রযুক্তি');

  const deleteTag = await simulateClientRequest(`tags/${tagId}`, { method: 'DELETE' });
  assert.strictEqual(deleteTag.status, 200);

  // Reporter CRUD
  const createRep = await simulateClientRequest('reporters', {
    method: 'POST',
    body: { name: 'তানভীর আহমেদ', email: 'tanvir@dailyprabaho.com', designation: 'বিশেষ প্রতিবেদক' }
  });
  assert.strictEqual(createRep.status, 201);
  const repId = createRep.data.id;

  const updateRep = await simulateClientRequest(`reporters/${repId}`, {
    method: 'PUT',
    body: { designation: 'প্রধান প্রতিবেদক', status: 'inactive' }
  });
  assert.strictEqual(updateRep.status, 200);
  assert.strictEqual(updateRep.data.designation, 'প্রধান প্রতিবেদক');
  assert.strictEqual(updateRep.data.status, 'inactive');

  const deleteRep = await simulateClientRequest(`reporters/${repId}`, { method: 'DELETE' });
  assert.strictEqual(deleteRep.status, 200);

  // Author CRUD
  const createAuthor = await simulateClientRequest('authors', {
    method: 'POST',
    body: { name: 'ড. আনিসুজ্জামান', designation: 'কলামিস্ট', is_active: true }
  });
  assert.strictEqual(createAuthor.status, 201);
  const authorId = createAuthor.data.id;

  const updateAuthor = await simulateClientRequest(`authors/${authorId}`, {
    method: 'PUT',
    body: { designation: 'প্রধান কলামিস্ট', is_active: false }
  });
  assert.strictEqual(updateAuthor.status, 200);
  assert.strictEqual(updateAuthor.data.designation, 'প্রধান কলামিস্ট');
  assert.strictEqual(updateAuthor.data.is_active, false);

  const deleteAuthor = await simulateClientRequest(`authors/${authorId}`, { method: 'DELETE' });
  assert.strictEqual(deleteAuthor.status, 200);
});
