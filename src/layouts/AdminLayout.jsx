import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { markAllNotificationsRead, addAuditLog } from '../store/adminSlice.js';
import { logout } from '../store/authSlice.js';
import { useLogoutMutation } from '../store/api/authApi.js';
import { useGetAdminNewsListQuery } from '../store/api/newsApi.js';
import { useGetNotificationsQuery } from '../store/api/notificationApi.js';
import {
  Briefcase as NewsroomBriefcaseIcon,
  CalendarDays as NewsroomCalendarIcon,
  Database as NewsroomSourceIcon,
  FileWarning as NewsroomCorrectionIcon,
  Lock as NewsroomEmbargoIcon,
  Newspaper as NewsroomHubIcon,
  Radio as LiveDeskIcon,
  Layers as SpecialCoverageIcon,
  Film as MultimediaHubIcon,
  Camera as PhotoGalleryIcon,
  Mic as PodcastCmsIcon,
  BookOpen as LongformStoryIcon,
  MessageSquare as CommentModerateIcon,
  HelpCircle as ReaderPollIcon,
  Award as EventsHubIcon,
  MapPin as HyperlocalIcon
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengaliFormatter.js';
import { backendLogout } from '../services/authRbacBackend.js';
import { getEffectiveRole, getRoleDisplayMeta, hasEffectivePermission } from '../utils/permissions.js';
import { EDITORIAL_EASE, FAST_TRANSITION, SPRING_SNAPPY, MotionDropdown } from '../components/common/MotionPrimitives.jsx';
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tag,
  Users,
  Feather,
  UserCheck,
  Shield,
  Image as ImageIcon,
  Megaphone,
  BarChart3,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  Home,
  LogOut,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Search,
  Sparkles,
  Clapperboard,
  GitPullRequest,
  KeyRound,
  User,
  Wallet
} from 'lucide-react';

/**
 * Editorial CMS & Admin Layout (Phase 8: RBAC & Authentication)
 * Supports dynamic permission-based navigation filtering, all 8 roles,
 * top navigation with breadcrumb, role switcher, notifications drawer, and user profile dropdown.
 */
export function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutMutation] = useLogoutMutation();

  const authState = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin);
  const reduxNotifications = adminState?.notifications || [];
  const currentUser = authState?.user || adminState?.currentUser || {
    name: 'অ্যাডমিন',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  };
  const currentRole = getEffectiveRole(authState, adminState);

  const { data: adminNewsData } = useGetAdminNewsListQuery(
    { per_page: 50 },
    { skip: !authState?.token }
  );

  const { data: apiNotificationsData } = useGetNotificationsQuery(
    { per_page: 25 },
    { skip: !authState?.token }
  );

  const notifications = (authState?.token && Array.isArray(apiNotificationsData?.items) && apiNotificationsData.items.length > 0)
    ? apiNotificationsData.items.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        read: Boolean(item.is_read),
        time: item.created_at
          ? new Date(item.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
          : 'সাম্প্রতিক',
        actionUrl: item.action_url
      }))
    : reduxNotifications;
  const pendingCount = (adminNewsData?.items || []).filter((a) =>
    ['submitted', 'under_review', 'in_review'].includes(a.status)
  ).length;

  // States
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const allNavItems = [
    {
      name: 'ড্যাশবোর্ড',
      nameEn: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      requiredPermission: 'news.read',
      badge: null
    },
    {
      name: 'সংবাদ ব্যবস্থাপনা',
      nameEn: 'News CMS',
      path: '/admin/news',
      icon: FileText,
      requiredPermission: 'news.read',
      badge: pendingCount > 0 ? toBengaliNumber(pendingCount) : null,
      badgeColor: 'bg-amber-500 text-stone-900 font-bold'
    },
    {
      name: 'সম্পাদকীয় কাজের ধারা',
      nameEn: 'Editorial Workflow',
      path: '/admin/workflow',
      icon: GitPullRequest,
      requiredPermission: ['news.review', 'news.create', 'news.read'],
      badge: 'অনুমোদন',
      badgeColor: 'bg-indigo-600 text-white font-bold'
    },
    {
      name: 'নিউজরুম কমান্ড সেন্টার',
      nameEn: 'Newsroom Hub',
      path: '/admin/newsroom',
      icon: NewsroomHubIcon,
      requiredPermission: ['assignment.view', 'assignment.manage', 'planning.manage', 'source.view', 'correction.request', 'embargo.manage']
    },
    {
      name: 'অ্যাসাইনমেন্ট বোর্ড',
      nameEn: 'Assignments',
      path: '/admin/newsroom/assignments',
      icon: NewsroomBriefcaseIcon,
      requiredPermission: ['assignment.view', 'assignment.manage']
    },
    {
      name: 'বার্তাকক্ষ পরিকল্পনা',
      nameEn: 'Editorial Planning',
      path: '/admin/newsroom/planning',
      icon: NewsroomCalendarIcon,
      requiredPermission: ['planning.manage', 'assignment.view', 'assignment.manage']
    },
    {
      name: 'সংবাদ উৎস ডিরেক্টরি',
      nameEn: 'Source Directory',
      path: '/admin/newsroom/sources',
      icon: NewsroomSourceIcon,
      requiredPermission: ['source.view', 'source.manage', 'source.confidential']
    },
    {
      name: 'সংবাদ সংশোধনী ও রিভিশন',
      nameEn: 'Corrections',
      path: '/admin/newsroom/corrections',
      icon: NewsroomCorrectionIcon,
      requiredPermission: ['correction.request', 'correction.approve', 'news.review']
    },
    {
      name: 'নিউজ এমবার্গো নিয়ন্ত্রণ',
      nameEn: 'Embargoes',
      path: '/admin/newsroom/embargoes',
      icon: NewsroomEmbargoIcon,
      requiredPermission: 'embargo.manage'
    },
    {
      name: 'লাইভ নিউজ ডেস্ক',
      nameEn: 'Live Desk',
      path: '/admin/live-desk',
      icon: LiveDeskIcon,
      requiredPermission: ['live.view', 'live.contribute', 'live.publish']
    },
    {
      name: 'বিশেষ আয়োজন CMS',
      nameEn: 'Special Coverage',
      path: '/admin/special-coverage',
      icon: SpecialCoverageIcon,
      requiredPermission: ['coverage.view', 'coverage.manage', 'coverage.publish']
    },
    {
      name: 'মাল্টিমিডিয়া স্টুডিও',
      nameEn: 'Multimedia CMS',
      path: '/admin/multimedia',
      icon: MultimediaHubIcon,
      requiredPermission: ['multimedia.view', 'multimedia.create', 'multimedia.publish']
    },
    {
      name: 'ফটো গ্যালারি ও স্টোরি',
      nameEn: 'Photo Galleries',
      path: '/admin/multimedia/galleries',
      icon: PhotoGalleryIcon,
      requiredPermission: ['multimedia.view', 'multimedia.create', 'multimedia.publish']
    },
    {
      name: 'পডকাস্ট ও অডিও',
      nameEn: 'Podcasts & Audio',
      path: '/admin/multimedia/podcasts',
      icon: PodcastCmsIcon,
      requiredPermission: ['multimedia.view', 'multimedia.create', 'multimedia.publish']
    },
    {
      name: 'স্টোরিটেলিং বিল্ডার',
      nameEn: 'Longform Storytelling',
      path: '/admin/multimedia/stories',
      icon: LongformStoryIcon,
      requiredPermission: ['multimedia.view', 'multimedia.create', 'multimedia.publish']
    },
    {
      name: 'বিভাগ ও বিষয়',
      nameEn: 'Categories',
      path: '/admin/categories',
      icon: FolderTree,
      requiredPermission: 'category.manage',
      badge: null
    },
    {
      name: 'ট্যাগ সমূহ',
      nameEn: 'Tags',
      path: '/admin/tags',
      icon: Tag,
      requiredPermission: 'seo.manage',
      badge: null
    },
    {
      name: 'প্রতিবেদক ও সাংবাদিক',
      nameEn: 'Reporters',
      path: '/admin/reporters',
      icon: Users,
      requiredPermission: 'user.manage',
      badge: null
    },
    {
      name: 'কলামিস্ট ও লেখক',
      nameEn: 'Authors',
      path: '/admin/authors',
      icon: Feather,
      requiredPermission: 'news.update',
      badge: null
    },
    {
      name: 'ব্যবহারকারী',
      nameEn: 'Users',
      path: '/admin/users',
      icon: UserCheck,
      requiredPermission: 'user.manage',
      badge: null
    },
    {
      name: 'ভূমিকা ও অনুমতি',
      nameEn: 'Roles & RBAC',
      path: '/admin/roles',
      icon: Shield,
      requiredPermission: 'role.manage',
      badge: null
    },
    {
      name: 'মিডিয়া লাইব্রেরি',
      nameEn: 'Media Library',
      path: '/admin/media',
      icon: ImageIcon,
      requiredPermission: 'media.upload',
      badge: null
    },
    {
      name: 'বিজ্ঞাপন ক্যাম্পেইন',
      nameEn: 'Advertisements',
      path: '/admin/advertisements',
      icon: Megaphone,
      requiredPermission: 'ads.manage',
      badge: null
    },
    {
      name: 'মন্তব্য মডারেশন',
      nameEn: 'Comments Moderation',
      path: '/admin/comments',
      icon: CommentModerateIcon,
      requiredPermission: 'comments.moderate',
      badge: null
    },
    {
      name: 'পাঠক মতামত জরিপ',
      nameEn: 'Reader Polls',
      path: '/admin/polls',
      icon: ReaderPollIcon,
      requiredPermission: 'polls.manage',
      badge: null
    },
    {
      name: 'ই-পেপার ব্যবস্থাপনা',
      nameEn: 'E-Paper CMS',
      path: '/admin/epaper',
      icon: NewsroomHubIcon,
      requiredPermission: ['epaper.view', 'epaper.manage', 'epaper.publish'],
      badge: 'PDF',
      badgeColor: 'bg-rose-600 text-white'
    },
    {
      name: 'AI বার্তাকক্ষ সহায়তা',
      nameEn: 'AI Assistant',
      path: '/admin/ai-assistant',
      icon: Sparkles,
      requiredPermission: ['ai.use', 'ai.logs.view', 'ai.settings.manage'],
      badge: 'AI',
      badgeColor: 'bg-indigo-600 text-white'
    },
    {
      name: 'নিউজ ক্রিয়েটর স্টুডিও',
      nameEn: 'Creator Studio',
      path: '/admin/creator-studio',
      icon: Clapperboard,
      requiredPermission: ['creator_studio.view', 'creator_studio.create', 'creator_studio.publish', 'creator_studio.settings.manage'],
      badge: 'Studio',
      badgeColor: 'bg-rose-600 text-white'
    },
    {
      name: 'মনিটাইজেশন ও আয়',
      nameEn: 'Monetization',
      path: '/admin/monetization',
      icon: Wallet,
      requiredPermission: [
        'subscriptions.manage',
        'payments.view',
        'payments.refund',
        'advertisers.manage',
        'campaigns.manage',
        'sponsored.manage',
        'sponsored.approve'
      ],
      badge: 'BDT',
      badgeColor: 'bg-emerald-700 text-white'
    },
    {
      name: 'নাগরিক সাংবাদিকতা',
      nameEn: 'Citizen & Community',
      path: '/admin/citizen-journalism',
      icon: CheckCheck,
      requiredPermission: ['citizen.review', 'citizen.publish', 'community.moderate', 'community.manage'],
      badge: 'UGC',
      badgeColor: 'bg-teal-700 text-white'
    },
    {
      name: 'ইভেন্ট ও বিশেষ উদ্যোগ',
      nameEn: 'Events & Projects',
      path: '/admin/events',
      icon: EventsHubIcon,
      requiredPermission: ['events.manage', 'events.participants.manage', 'events.competitions.judge', 'events.results.publish'],
      badge: 'Events',
      badgeColor: 'bg-rose-700 text-white'
    },
    {
      name: 'হাইপারলোকাল নেটওয়ার্ক',
      nameEn: 'Hyperlocal Network',
      path: '/admin/hyperlocal',
      icon: HyperlocalIcon,
      requiredPermission: [
        'hyperlocal.view',
        'hyperlocal.locations.manage',
        'hyperlocal.correspondents.manage',
        'hyperlocal.assignments.manage',
        'hyperlocal.regional.approve',
        'hyperlocal.analytics.view'
      ],
      badge: '৬৪ জেলা',
      badgeColor: 'bg-rose-700 text-white'
    },
    {
      name: 'নিউজ API ও সিন্ডিকেশন',
      nameEn: 'News API & Syndication',
      path: '/admin/syndication',
      icon: KeyRound,
      requiredPermission: [
        'syndication.view',
        'syndication.partners.approve',
        'syndication.licenses.manage',
        'syndication.plans.manage',
        'syndication.abuse.manage'
      ],
      badge: 'API v1',
      badgeColor: 'bg-indigo-600 text-white'
    },
    {
      name: 'অ্যানালিটিক্স',
      nameEn: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
      requiredPermission: 'analytics.view',
      badge: 'লাইভ',
      badgeColor: 'bg-emerald-500 text-white animate-pulse'
    },
    {
      name: 'অডিট লগ',
      nameEn: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: History,
      requiredPermission: ['user.manage', 'settings.manage'],
      badge: null
    },
    {
      name: 'সিস্টেম নির্ভরযোগ্যতা',
      nameEn: 'System Reliability',
      path: '/admin/reliability',
      icon: ShieldCheck,
      requiredPermission: 'settings.manage',
      badge: null
    },
    {
      name: 'সিস্টেম সেটিংস',
      nameEn: 'Settings',
      path: '/admin/settings',
      icon: Settings,
      requiredPermission: 'settings.manage',
      badge: null
    }
  ];

  // RBAC Permission-based dynamic menu filtering using real Sanctum permissions
  const navItems = allNavItems.filter((item) =>
    hasEffectivePermission(authState, adminState, item.requiredPermission)
  );

  // Route map for human-readable breadcrumb
  const BREADCRUMB_MAP = {
    'admin': 'কন্ট্রোল রুম',
    'dashboard': 'ড্যাশবোর্ড ওভারভিউ',
    'news': 'সংবাদ ব্যবস্থাপনা',
    'workflow': 'সম্পাদকীয় কাজের ধারা ও অনুমোদন',
    'categories': 'বিভাগ ও বিষয়',
    'tags': 'ট্যাগ তালিকা',
    'reporters': 'প্রতিবেদক ও ব্যুরো',
    'authors': 'কলামিস্ট ও লেখক',
    'users': 'ব্যবহারকারী অ্যাকাউন্ট',
    'roles': 'ভূমিকা ও এক্সেস কন্ট্রোল (RBAC)',
    'media': 'মিডিয়া লাইব্রেরি',
    'newsroom': 'নিউজরুম কমান্ড সেন্টার',
    'assignments': 'অ্যাসাইনমেন্ট বোর্ড',
    'planning': 'বার্তাকক্ষ পরিকল্পনা',
    'sources': 'সংবাদ উৎস ডিরেক্টরি',
    'corrections': 'সংবাদ সংশোধনী',
    'embargoes': 'নিউজ এমবার্গো',
    'live-desk': 'লাইভ নিউজ ডেস্ক',
    'special-coverage': 'বিশেষ আয়োজন CMS',
    'multimedia': 'মাল্টিমিডিয়া স্টুডিও',
    'galleries': 'ফটো গ্যালারি ও স্টোরি',
    'podcasts': 'পডকাস্ট ও অডিও',
    'playlists': 'ভিডিও প্লেলিস্ট',
    'timelines': 'ইন্টারঅ্যাক্টিভ টাইমলাইন',
    'stories': 'স্টোরিটেলিং বিল্ডার',
    'advertisements': 'বিজ্ঞাপন ক্যাম্পেইন',
    'comments': 'মন্তব্য মডারেশন',
    'polls': 'পাঠক মতামত জরিপ',
    'epaper': 'ডিজিটাল ই-পেপার স্টুডিও',
    'analytics': 'পাঠক অ্যানালিটিক্স',
    'hyperlocal': 'হাইপারলোকাল ও আঞ্চলিক ডেস্ক',
    'syndication': 'নিউজ API ও সিন্ডিকেশন',
    'audit-logs': 'অডিট ট্রেইল লগ',
    'reliability': 'সিস্টেম নির্ভরযোগ্যতা ও নিরাপত্তা',
    'settings': 'সিস্টেম কনফিগারেশন',
    'profile': 'আমার প্রোফাইল ও নিরাপত্তা'
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    try {
      await logoutMutation().unwrap();
    } catch {
      // Ignore network/401 errors on token revocation
    }
    dispatch(logout());
    backendLogout();
    dispatch(addAuditLog({
      user: currentUser.name,
      role: currentRole,
      action: 'সিস্টেম লগআউট (User Sign Out)',
      target: 'Admin CMS Portal'
    }));
    navigate('/admin/login');
  };

  const currentRoleObj = getRoleDisplayMeta(currentRole, currentUser?.roleName);

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans text-stone-900 selection:bg-rose-900 selection:text-white">
      
      {/* 1. Mobile Sidebar Backdrop Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FAST_TRANSITION}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 2. Responsive Sidebar (Desktop Collapsible & Mobile Slide-out) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-stone-950 text-stone-300 flex flex-col border-r border-stone-800 transition-all duration-300 ease-in-out lg:static ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-800/80 bg-stone-950">
          {(!collapsed || mobileOpen) ? (
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center text-white font-bold font-serif-bn shadow-xs">
                প্র
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold font-serif-bn text-white tracking-wide">
                  দৈনিক বার্তা প্রবাহ
                </span>
                <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Editorial CMS
                </span>
              </div>
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center text-white font-bold font-serif-bn shadow-xs mx-auto">
              প্র
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close mobile navigation"
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExact = location.pathname === item.path;
            const isSub = item.path !== '/admin/dashboard' && item.path !== '/admin/newsroom' && location.pathname.startsWith(item.path);
            const isActive = isExact || isSub;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors group relative ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-sidebar-active"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-lg bg-rose-700 shadow-sm"
                  />
                )}
                <Icon className={`relative z-10 w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-white group-hover:scale-105'}`} />
                {(!collapsed || mobileOpen) && (
                  <span className="relative z-10 flex-1 truncate">{item.name}</span>
                )}
                {(!collapsed || mobileOpen) && item.badge && (
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${item.badgeColor || 'bg-stone-800 text-stone-300'}`}>
                    {item.badge}
                  </span>
                )}
                {/* Collapsed Tooltip */}
                {collapsed && !mobileOpen && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-stone-800 text-white text-[11px] rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-stone-800/80 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-stone-700 shrink-0"
            />
            {(!collapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-stone-400 truncate">
                  {currentRoleObj.nameBn}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <nav className="flex items-center gap-1.5 text-xs text-stone-500 overflow-hidden" aria-label="Breadcrumb">
              <Link
                to="/admin/dashboard"
                className="hover:text-rose-700 flex items-center gap-1 font-medium transition-colors shrink-0"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">সিএমএস</span>
              </Link>
              {pathParts.map((part, idx) => {
                if (part === 'admin' && pathParts.length > 1) return null;
                const isLast = idx === pathParts.length - 1;
                const label = BREADCRUMB_MAP[part] || part;

                return (
                  <React.Fragment key={idx}>
                    <span className="text-stone-400">/</span>
                    <span className={`truncate capitalize ${isLast ? 'font-bold text-stone-900' : 'text-stone-600 hover:text-rose-700'}`}>
                      {label}
                    </span>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions, Role Selector, Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Authenticated Database Role Indicator */}
            <div className="hidden md:flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-stone-500 font-medium">রোল:</span>
              <span className="font-semibold text-stone-800">{currentRoleObj.nameBn}</span>
            </div>

            {/* Public Website Preview Link */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors"
              title="পাবলিক পোর্টাল দেখুন"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              <span>পাবলিক পোর্টাল</span>
            </Link>

            {/* Notifications Menu */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="বিজ্ঞপ্তি"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
                )}
              </button>

              {/* Notifications Popover */}
              <MotionDropdown
                isOpen={notifDropdownOpen}
                className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50"
              >
                  <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">বিজ্ঞপ্তি ও নোটিফিকেশন</h4>
                      <p className="text-[10px] text-stone-500">
                        {toBengaliNumber(unreadCount)} টি অপঠিত বার্তা
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch(markAllNotificationsRead())}
                        className="text-[10px] text-rose-700 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>সব পড়া হয়েছে</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-stone-400">কোনো নোটিফিকেশন নেই</p>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 text-xs transition-colors hover:bg-stone-50 ${
                            !item.read ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-stone-900 text-xs">{item.title}</h5>
                            <span className="text-[10px] text-stone-400 shrink-0">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">
                            {item.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-stone-100 text-center">
                    <Link
                      to="/admin/audit-logs"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-xs font-semibold text-rose-700 hover:underline"
                    >
                      সকল অডিট লগ ও অ্যাক্টিভিটি দেখুন →
                    </Link>
                  </div>
              </MotionDropdown>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="User menu"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-700/30"
                />
                <span className="hidden md:block text-left">
                  <p className="text-xs font-bold text-stone-800 leading-none">{currentUser.name}</p>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight mt-0.5">
                    {currentRoleObj.nameBn}
                  </p>
                </span>
              </button>

              {/* Profile Menu Dropdown */}
              <MotionDropdown
                isOpen={userDropdownOpen}
                className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50"
              >
                  <div className="px-4 py-2.5 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-stone-500 truncate font-mono">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${currentRoleObj.badgeColor}`}>
                        {currentRoleObj.nameBn}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/admin/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-rose-700" />
                    <span>আমার প্রোফাইল (My Profile)</span>
                  </Link>

                  <Link
                    to="/admin/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 font-medium transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-stone-400" />
                    <span>পাসওয়ার্ড পরিবর্তন (Change Password)</span>
                  </Link>

                  <Link
                    to="/admin/users"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 font-medium transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-stone-400" />
                    <span>ব্যবহারকারী ব্যবস্থাপনা</span>
                  </Link>

                  <Link
                    to="/admin/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4 text-stone-400" />
                    <span>সিএমএস কনফিগারেশন</span>
                  </Link>

                  <div className="border-t border-stone-100 my-1"></div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>লগআউট করুন (Sign Out)</span>
                  </button>
              </MotionDropdown>
            </div>

          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
          >
            {children || <Outlet />}
          </motion.div>
        </main>

      </div>
    </div>
  );
}

export default AdminLayout;
