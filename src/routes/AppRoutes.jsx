import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import HomePage from '../pages/public/HomePage.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import PageLoadingFallback from '../components/common/PageLoadingFallback.jsx';

// Public Secondary Pages (Code-split with dynamic imports)
const NewsDetailsPage = lazy(() => import('../pages/public/NewsDetailsPage.jsx'));
const CategoryPage = lazy(() => import('../pages/public/CategoryPage.jsx'));
const AuthorPage = lazy(() => import('../pages/public/AuthorPage.jsx'));
const TagPage = lazy(() => import('../pages/public/TagPage.jsx'));
const SearchPage = lazy(() => import('../pages/public/SearchPage.jsx'));
const LiveBlogsHubPage = lazy(() => import('../pages/public/LiveBlogsHubPage.jsx'));
const LiveBlogDetailPage = lazy(() => import('../pages/public/LiveBlogDetailPage.jsx'));
const SpecialCoverageDirectoryPage = lazy(() => import('../pages/public/SpecialCoverageDirectoryPage.jsx'));
const SpecialCoverageDetailPage = lazy(() => import('../pages/public/SpecialCoverageDetailPage.jsx'));
const MultimediaHubPage = lazy(() => import('../pages/public/MultimediaHubPage.jsx'));
const PhotoCollectionDetailPage = lazy(() => import('../pages/public/PhotoCollectionDetailPage.jsx'));
const PodcastDirectoryPage = lazy(() => import('../pages/public/PodcastDirectoryPage.jsx'));
const PodcastDetailPage = lazy(() => import('../pages/public/PodcastDetailPage.jsx'));
const VideoPlaylistDetailPage = lazy(() => import('../pages/public/VideoPlaylistDetailPage.jsx'));
const InteractiveTimelineDetailPage = lazy(() => import('../pages/public/InteractiveTimelineDetailPage.jsx'));
const LongformStoryPage = lazy(() => import('../pages/public/LongformStoryPage.jsx'));
const ReaderAuthPage = lazy(() => import('../pages/public/ReaderAuthPage.jsx'));
const ReaderProfilePage = lazy(() => import('../pages/public/ReaderProfilePage.jsx'));
const PersonalizedFeedPage = lazy(() => import('../pages/public/PersonalizedFeedPage.jsx'));
const EpaperReaderPage = lazy(() => import('../pages/public/EpaperReaderPage.jsx'));
const NewsArchivePage = lazy(() => import('../pages/public/NewsArchivePage.jsx'));
const SubscriptionPlansPage = lazy(() => import('../pages/public/SubscriptionPlansPage.jsx'));
const CommunityHubPage = lazy(() => import('../pages/public/CommunityHubPage.jsx'));
const CitizenSubmitPage = lazy(() => import('../pages/public/CitizenSubmitPage.jsx'));
const ContributorProfilePage = lazy(() => import('../pages/public/ContributorProfilePage.jsx'));
const EventsHubPage = lazy(() => import('../pages/public/EventsHubPage.jsx'));
const SpecialProjectDetailPage = lazy(() => import('../pages/public/SpecialProjectDetailPage.jsx'));
const EventDetailPage = lazy(() => import('../pages/public/EventDetailPage.jsx'));
const CertificateVerifyPage = lazy(() => import('../pages/public/CertificateVerifyPage.jsx'));
const HyperlocalHubPage = lazy(() => import('../pages/public/HyperlocalHubPage.jsx'));
const DeveloperPortalPage = lazy(() => import('../pages/public/DeveloperPortalPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

// Admin Authentication Routes (Code-split)
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage.jsx'));
const AdminProfilePage = lazy(() => import('../pages/admin/AdminProfilePage.jsx'));

// Admin Layout & CMS Modules (Code-split)
const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'));
const AdminDashboardOverview = lazy(() => import('../pages/admin/AdminDashboardOverview.jsx'));
const AdminNewsroomDashboardPage = lazy(() => import('../pages/admin/newsroom/AdminNewsroomDashboardPage.jsx'));
const AdminAssignmentsPage = lazy(() => import('../pages/admin/newsroom/AdminAssignmentsPage.jsx'));
const AdminAssignmentDetailPage = lazy(() => import('../pages/admin/newsroom/AdminAssignmentDetailPage.jsx'));
const AdminPlanningPage = lazy(() => import('../pages/admin/newsroom/AdminPlanningPage.jsx'));
const AdminSourcesPage = lazy(() => import('../pages/admin/newsroom/AdminSourcesPage.jsx'));
const AdminCorrectionsPage = lazy(() => import('../pages/admin/newsroom/AdminCorrectionsPage.jsx'));
const AdminEmbargoesPage = lazy(() => import('../pages/admin/newsroom/AdminEmbargoesPage.jsx'));
const AdminLiveDeskPage = lazy(() => import('../pages/admin/live/AdminLiveDeskPage.jsx'));
const AdminLiveStudioPage = lazy(() => import('../pages/admin/live/AdminLiveStudioPage.jsx'));
const AdminSpecialCoveragesPage = lazy(() => import('../pages/admin/live/AdminSpecialCoveragesPage.jsx'));
const AdminSpecialCoverageEditorPage = lazy(() => import('../pages/admin/live/AdminSpecialCoverageEditorPage.jsx'));
const AdminMultimediaStudioPage = lazy(() => import('../pages/admin/multimedia/AdminMultimediaStudioPage.jsx'));
const AdminPhotoCollectionsPage = lazy(() => import('../pages/admin/multimedia/AdminPhotoCollectionsPage.jsx'));
const AdminPodcastsPage = lazy(() => import('../pages/admin/multimedia/AdminPodcastsPage.jsx'));
const AdminPlaylistsAndTimelinesPage = lazy(() => import('../pages/admin/multimedia/AdminPlaylistsAndTimelinesPage.jsx'));
const AdminLongformStoriesPage = lazy(() => import('../pages/admin/multimedia/AdminLongformStoriesPage.jsx'));
const AdminLongformBuilderPage = lazy(() => import('../pages/admin/multimedia/AdminLongformBuilderPage.jsx'));
const AdminNewsPage = lazy(() => import('../pages/admin/AdminNewsPage.jsx'));
const AdminWorkflowPage = lazy(() => import('../pages/admin/AdminWorkflowPage.jsx'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage.jsx'));
const AdminTagsPage = lazy(() => import('../pages/admin/AdminTagsPage.jsx'));
const AdminReportersPage = lazy(() => import('../pages/admin/AdminReportersPage.jsx'));
const AdminAuthorsPage = lazy(() => import('../pages/admin/AdminAuthorsPage.jsx'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage.jsx'));
const AdminRolesPage = lazy(() => import('../pages/admin/AdminRolesPage.jsx'));
const AdminMediaPage = lazy(() => import('../pages/admin/AdminMediaPage.jsx'));
const AdminAdsPage = lazy(() => import('../pages/admin/AdminAdsPage.jsx'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage.jsx'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage.jsx'));
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AdminAuditLogsPage.jsx'));
const AdminEngagementPage = lazy(() => import('../pages/admin/AdminEngagementPage.jsx'));
const AdminEpaperPage = lazy(() => import('../pages/admin/AdminEpaperPage.jsx'));
const AdminAiAssistantPage = lazy(() => import('../pages/admin/AdminAiAssistantPage.jsx'));
const AdminCreatorStudioPage = lazy(() => import('../pages/admin/creator-studio/AdminCreatorStudioPage.jsx'));
const CreatorShowcasePage = lazy(() => import('../pages/public/CreatorShowcasePage.jsx'));
const AdminMonetizationPage = lazy(() => import('../pages/admin/AdminMonetizationPage.jsx'));
const AdminCitizenModerationPage = lazy(() => import('../pages/admin/AdminCitizenModerationPage.jsx'));
const AdminEventsPage = lazy(() => import('../pages/admin/AdminEventsPage.jsx'));
const AdminHyperlocalPage = lazy(() => import('../pages/admin/AdminHyperlocalPage.jsx'));
const AdminSyndicationPage = lazy(() => import('../pages/admin/AdminSyndicationPage.jsx'));
const AdminReliabilityPage = lazy(() => import('../pages/admin/AdminReliabilityPage.jsx'));

/**
 * Main Application Routing Architecture (Phase 13: Optimized Code-Splitting)
 * Eager loads Homepage; dynamically splits admin modules & secondary views with Suspense.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* 1. Admin Authentication Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />

        {/* 2. Admin & Editorial CMS Routes (Protected by RBAC) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Dashboard: requires news.read */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredPermission="news.read">
                <AdminDashboardOverview />
              </ProtectedRoute>
            }
          />

          {/* User Profile & Change Password */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />

          {/* News CMS: requires news.read */}
          <Route
            path="news"
            element={
              <ProtectedRoute requiredPermission="news.read">
                <AdminNewsPage />
              </ProtectedRoute>
            }
          />

          {/* Phase 15: Advanced Newsroom Management */}
          <Route
            path="newsroom"
            element={
              <ProtectedRoute
                requiredPermission={[
                  'assignment.view',
                  'assignment.manage',
                  'planning.manage',
                  'source.view',
                  'correction.request',
                  'embargo.manage'
                ]}
              >
                <AdminNewsroomDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="newsroom/assignments"
            element={
              <ProtectedRoute requiredPermission={['assignment.view', 'assignment.manage']}>
                <AdminAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="newsroom/assignments/:id"
            element={
              <ProtectedRoute requiredPermission={['assignment.view', 'assignment.manage']}>
                <AdminAssignmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="newsroom/planning"
            element={
              <ProtectedRoute requiredPermission={['planning.manage', 'assignment.view', 'assignment.manage']}>
                <AdminPlanningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="newsroom/sources"
            element={
              <ProtectedRoute requiredPermission={['source.view', 'source.manage', 'source.confidential']}>
                <AdminSourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="newsroom/corrections"
            element={
              <ProtectedRoute requiredPermission={['correction.request', 'correction.approve', 'news.review']}>
                <AdminCorrectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="newsroom/embargoes"
            element={
              <ProtectedRoute requiredPermission="embargo.manage">
                <AdminEmbargoesPage />
              </ProtectedRoute>
            }
          />

          {/* Editorial Workflow: editorial staff */}
          <Route
            path="workflow"
            element={
              <ProtectedRoute requiredPermission={['news.review', 'news.create', 'news.read']}>
                <AdminWorkflowPage />
              </ProtectedRoute>
            }
          />

          {/* Categories: requires category.manage */}
          <Route
            path="categories"
            element={
              <ProtectedRoute requiredPermission="category.manage">
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />

          {/* Tags: requires seo.manage */}
          <Route
            path="tags"
            element={
              <ProtectedRoute requiredPermission="seo.manage">
                <AdminTagsPage />
              </ProtectedRoute>
            }
          />

          {/* Reporters: requires user.manage */}
          <Route
            path="reporters"
            element={
              <ProtectedRoute requiredPermission="user.manage">
                <AdminReportersPage />
              </ProtectedRoute>
            }
          />

          {/* Authors: requires news.update */}
          <Route
            path="authors"
            element={
              <ProtectedRoute requiredPermission="news.update">
                <AdminAuthorsPage />
              </ProtectedRoute>
            }
          />

          {/* Users Management: requires user.manage */}
          <Route
            path="users"
            element={
              <ProtectedRoute requiredPermission="user.manage">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          {/* Roles & RBAC Matrix: requires role.manage */}
          <Route
            path="roles"
            element={
              <ProtectedRoute requiredPermission="role.manage">
                <AdminRolesPage />
              </ProtectedRoute>
            }
          />

          {/* Media Library: requires media.upload */}
          <Route
            path="media"
            element={
              <ProtectedRoute requiredPermission="media.upload">
                <AdminMediaPage />
              </ProtectedRoute>
            }
          />

          {/* Advertisements: requires ads.manage */}
          <Route
            path="advertisements"
            element={
              <ProtectedRoute requiredPermission="ads.manage">
                <AdminAdsPage />
              </ProtectedRoute>
            }
          />
          <Route path="ads" element={<Navigate to="/admin/advertisements" replace />} />

          {/* Analytics: requires analytics.view */}
          <Route
            path="analytics"
            element={
              <ProtectedRoute requiredPermission="analytics.view">
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* System Settings: requires settings.manage */}
          <Route
            path="settings"
            element={
              <ProtectedRoute requiredPermission="settings.manage">
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Live News Desk & Special Coverage CMS (Phase 16) */}
          <Route
            path="live-desk"
            element={
              <ProtectedRoute requiredPermission={['live.view', 'live.contribute', 'live.publish']}>
                <AdminLiveDeskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="live-desk/:id"
            element={
              <ProtectedRoute requiredPermission={['live.view', 'live.contribute', 'live.publish']}>
                <AdminLiveStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="special-coverage"
            element={
              <ProtectedRoute requiredPermission={['coverage.view', 'coverage.manage', 'coverage.publish']}>
                <AdminSpecialCoveragesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="special-coverage/:id"
            element={
              <ProtectedRoute requiredPermission={['coverage.view', 'coverage.manage', 'coverage.publish']}>
                <AdminSpecialCoverageEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Multimedia CMS & Storytelling Builder (Phase 17) */}
          <Route
            path="multimedia"
            element={
              <ProtectedRoute requiredPermission={['multimedia.view', 'multimedia.create', 'multimedia.publish']}>
                <AdminMultimediaStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="multimedia/galleries"
            element={
              <ProtectedRoute requiredPermission={['multimedia.view', 'multimedia.create', 'multimedia.publish']}>
                <AdminPhotoCollectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="multimedia/podcasts"
            element={
              <ProtectedRoute requiredPermission={['multimedia.view', 'multimedia.create', 'multimedia.publish']}>
                <AdminPodcastsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="multimedia/playlists"
            element={
              <ProtectedRoute requiredPermission={['multimedia.view', 'multimedia.create', 'multimedia.publish']}>
                <AdminPlaylistsAndTimelinesPage initialMode="playlists" />
              </ProtectedRoute>
            }
          />
          <Route
            path="multimedia/timelines"
            element={
              <ProtectedRoute requiredPermission={['multimedia.view', 'multimedia.create', 'multimedia.publish']}>
                <AdminPlaylistsAndTimelinesPage initialMode="timelines" />
              </ProtectedRoute>
            }
          />
          <Route
            path="multimedia/stories"
            element={
              <ProtectedRoute requiredPermission={['multimedia.view', 'multimedia.create', 'multimedia.publish']}>
                <AdminLongformStoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="multimedia/stories/:id"
            element={
              <ProtectedRoute requiredPermission={['multimedia.view', 'multimedia.create', 'multimedia.publish']}>
                <AdminLongformBuilderPage />
              </ProtectedRoute>
            }
          />

          {/* Reader Engagement Moderation & Polls CMS */}
          <Route
            path="comments"
            element={
              <ProtectedRoute requiredPermission="comments.moderate">
                <AdminEngagementPage initialTab="comments" />
              </ProtectedRoute>
            }
          />
          <Route
            path="polls"
            element={
              <ProtectedRoute requiredPermission="polls.manage">
                <AdminEngagementPage initialTab="polls" />
              </ProtectedRoute>
            }
          />

          {/* Digital E-paper CMS (Phase 19) */}
          <Route
            path="epaper"
            element={
              <ProtectedRoute requiredPermission={['epaper.view', 'epaper.manage', 'epaper.publish']}>
                <AdminEpaperPage />
              </ProtectedRoute>
            }
          />

          {/* AI Newsroom Assistant Studio (Phase 20) */}
          <Route
            path="ai-assistant"
            element={
              <ProtectedRoute requiredPermission={['ai.use', 'ai.logs.view', 'ai.settings.manage']}>
                <AdminAiAssistantPage />
              </ProtectedRoute>
            }
          />

          {/* News Creator Studio (Phase 26) */}
          <Route
            path="creator-studio"
            element={
              <ProtectedRoute
                requiredPermission={[
                  'creator_studio.view',
                  'creator_studio.create',
                  'creator_studio.publish',
                  'creator_studio.settings.manage',
                ]}
              >
                <AdminCreatorStudioPage />
              </ProtectedRoute>
            }
          />

          {/* NewsFlow Monetization Center (Phase 21) */}
          <Route
            path="monetization"
            element={
              <ProtectedRoute
                requiredPermission={[
                  'subscriptions.manage',
                  'payments.view',
                  'payments.refund',
                  'advertisers.manage',
                  'campaigns.manage',
                  'sponsored.manage',
                  'sponsored.approve'
                ]}
              >
                <AdminMonetizationPage />
              </ProtectedRoute>
            }
          />

          {/* Citizen Journalism & Community Moderation Desk (Phase 22) */}
          <Route
            path="citizen-journalism"
            element={
              <ProtectedRoute
                requiredPermission={[
                  'citizen.review',
                  'citizen.publish',
                  'community.moderate',
                  'community.manage'
                ]}
              >
                <AdminCitizenModerationPage />
              </ProtectedRoute>
            }
          />

          {/* Events & Special Projects Management Console (Phase 23) */}
          <Route
            path="events"
            element={
              <ProtectedRoute
                requiredPermission={[
                  'events.manage',
                  'events.participants.manage',
                  'events.competitions.judge',
                  'events.results.publish'
                ]}
              >
                <AdminEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="hyperlocal"
            element={
              <ProtectedRoute
                requiredPermission={[
                  'hyperlocal.view',
                  'hyperlocal.locations.manage',
                  'hyperlocal.correspondents.manage',
                  'hyperlocal.assignments.manage',
                  'hyperlocal.regional.approve',
                  'hyperlocal.analytics.view'
                ]}
              >
                <AdminHyperlocalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="syndication"
            element={
              <ProtectedRoute
                requiredPermission={[
                  'syndication.view',
                  'syndication.partners.approve',
                  'syndication.licenses.manage',
                  'syndication.plans.manage',
                  'syndication.abuse.manage'
                ]}
              >
                <AdminSyndicationPage />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs: requires settings.manage */}
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute requiredPermission="settings.manage">
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reliability"
            element={
              <ProtectedRoute requiredPermission="settings.manage">
                <AdminReliabilityPage />
              </ProtectedRoute>
            }
          />
          <Route path="audit" element={<Navigate to="/admin/audit-logs" replace />} />
        </Route>

        {/* 3. Public Newspaper Website Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="news/:slug" element={<NewsDetailsPage />} />
          <Route path="live" element={<LiveBlogsHubPage />} />
          <Route path="live/:slug" element={<LiveBlogDetailPage />} />
          <Route path="coverage" element={<SpecialCoverageDirectoryPage />} />
          <Route path="coverage/:slug" element={<SpecialCoverageDetailPage />} />
          <Route path="multimedia" element={<MultimediaHubPage />} />
          <Route path="multimedia/galleries/:slug" element={<PhotoCollectionDetailPage />} />
          <Route path="multimedia/podcasts" element={<PodcastDirectoryPage />} />
          <Route path="multimedia/podcasts/:slug" element={<PodcastDetailPage />} />
          <Route path="multimedia/playlists/:slug" element={<VideoPlaylistDetailPage />} />
          <Route path="multimedia/timelines/:slug" element={<InteractiveTimelineDetailPage />} />
          <Route path="creator-studio/:uuid" element={<CreatorShowcasePage />} />
          <Route path="stories/:slug" element={<LongformStoryPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="category/:slug/:subcategory" element={<CategoryPage />} />
          <Route path="author/:slug" element={<AuthorPage />} />
          <Route path="tag/:slug" element={<TagPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="archive" element={<NewsArchivePage />} />
          <Route path="epaper" element={<EpaperReaderPage />} />
          <Route path="epaper/:date" element={<EpaperReaderPage />} />
          <Route path="epaper/edition/:slug" element={<EpaperReaderPage />} />
          <Route path="subscribe" element={<SubscriptionPlansPage />} />
          <Route path="membership" element={<SubscriptionPlansPage />} />
          <Route path="community" element={<CommunityHubPage />} />
          <Route path="citizen" element={<CommunityHubPage />} />
          <Route path="citizen/submit" element={<CitizenSubmitPage />} />
          <Route path="citizen/contributor/:handle" element={<ContributorProfilePage />} />
          <Route path="events" element={<EventsHubPage />} />
          <Route path="events/calendar" element={<EventsHubPage initialView="calendar" />} />
          <Route path="events/projects/:slug" element={<SpecialProjectDetailPage />} />
          <Route path="events/:slug" element={<EventDetailPage />} />
          <Route path="certificates/verify" element={<CertificateVerifyPage />} />
          <Route path="certificates/verify/:code" element={<CertificateVerifyPage />} />
          <Route path="local" element={<HyperlocalHubPage />} />
          <Route path="local/:divisionSlug" element={<HyperlocalHubPage />} />
          <Route path="local/district/:districtSlug" element={<HyperlocalHubPage />} />
          <Route path="local/upazila/:upazilaSlug" element={<HyperlocalHubPage />} />
          <Route path="developers" element={<DeveloperPortalPage />} />
          <Route path="api-docs" element={<Navigate to="/developers" replace />} />
          <Route path="saved" element={<HomePage />} />
          <Route path="for-you" element={<PersonalizedFeedPage />} />
          <Route path="reader/login" element={<ReaderAuthPage defaultMode="login" />} />
          <Route path="reader/register" element={<ReaderAuthPage defaultMode="register" />} />
          <Route path="reader/profile" element={<ReaderProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* 4. Global Fallback 404 Route */}
        <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
