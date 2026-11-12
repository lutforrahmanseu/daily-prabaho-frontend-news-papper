import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetAuthorBySlugQuery, useGetAuthorsQuery } from '../../store/api/authorApi.js';
import { usePublicArticles } from '../../hooks/usePortalData.js';
import NewsCard from '../../components/news/NewsCard.jsx';
import SEO from '../../components/common/SEO.jsx';
import AdPlacement from '../../components/common/AdPlacement.jsx';
import PopularNews from '../../components/news/PopularNews.jsx';
import TodayPollWidget from '../../components/news/TodayPollWidget.jsx';
import FollowTargetButton from '../../components/reader/FollowTargetButton.jsx';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import {
  User,
  Mail,
  MapPin,
  FileText,
  Twitter,
  Facebook,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Award
} from 'lucide-react';

export function AuthorPage() {
  const { slug } = useParams();
  const { language } = useSelector((state) => state.ui);
  const isBn = language === 'bn';

  const { data: apiAuthor } = useGetAuthorBySlugQuery(slug, { skip: !slug });
  const { data: authorsResponse } = useGetAuthorsQuery({ per_page: 20, active_only: true });
  const otherAuthors = (authorsResponse?.items || [])
    .filter((a) => a.slug !== slug && a.id !== apiAuthor?.id)
    .slice(0, 4);
  const { articles } = usePublicArticles(
    apiAuthor?.id ? { author: apiAuthor.id, per_page: 50 } : { per_page: 50 }
  );

  // Author profile from Laravel API (fallback to decoded slug label)
  const reporter = apiAuthor ? {
    ...apiAuthor,
    roleBn: apiAuthor.designation || 'কলামিস্ট ও সাংবাদিক'
  } : {
    id: slug,
    name: decodeURIComponent(slug || '').replace(/-/g, ' '),
    nameEn: decodeURIComponent(slug || '').replace(/-/g, ' '),
    role: 'Journalist',
    roleBn: 'সাংবাদিক ও প্রতিবেদক',
    email: `${slug}@dailyprabaho.com`,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bio: 'দৈনিক বার্তা প্রবাহের সম্পাদকীয় দলের সাংবাদিক।',
    articlesCount: 0,
    status: 'active'
  };

  // Articles by this author
  const authorArticles = apiAuthor?.id
    ? articles
    : articles.filter(
        (a) => a.authorSlug === slug || String(a.authorId) === String(reporter.id) || a.author === reporter.name
      );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  const totalItems = authorArticles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedArticles = authorArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const authorName = isBn ? reporter.name : reporter.nameEn;
  const roleName = isBn ? reporter.roleBn : reporter.role;

  return (
    <>
      <SEO
        title={`${authorName} - লেখক ও সাংবাদিক পরিচিতি`}
        description={reporter.bio}
        image={reporter.avatar}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          'mainEntity': {
            '@type': 'Person',
            'name': authorName,
            'jobTitle': roleName,
            'image': reporter.avatar,
            'description': reporter.bio
          }
        }}
      />

      {/* Top Leaderboard Advertisement Slot */}
      <AdPlacement placement="leaderboard" className="mb-4 sm:mb-6" />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 flex-wrap font-sans">
        <Link to="/" className="hover:text-rose-700 transition-colors">
          {isBn ? 'প্রচ্ছদ' : 'Home'}
        </Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span>{isBn ? 'লেখক ও প্রতিবেদক' : 'Authors & Journalists'}</span>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span className="text-rose-700 font-bold">{authorName}</span>
      </nav>

      {/* Author Profile Header */}
      <header className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <img
              src={reporter.avatar}
              alt={authorName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-rose-50 shadow-md"
            />
            <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-rose-700 text-white shadow">
              <Award className="w-4 h-4" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif-bn tracking-tight">
                  {authorName}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-rose-700 font-sans mt-0.5">
                  {roleName}
                </p>
              </div>

              {/* Stat badge & Follow */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold">
                  <FileText className="w-4 h-4 text-rose-700" />
                  <span>
                    {isBn
                      ? `মোট ${toBengaliNumber(authorArticles.length)}টি প্রতিবেদন`
                      : `${authorArticles.length} published stories`}
                  </span>
                </div>
                <FollowTargetButton
                  type="author"
                  targetId={apiAuthor?.id || null}
                  targetSlug={apiAuthor?.slug || slug}
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 font-serif-bn leading-relaxed max-w-2xl">
              {reporter.bio}
            </p>

            {/* Meta tags & social */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-stone-500">
              {reporter.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{reporter.location}</span>
                </div>
              )}
              {reporter.email && (
                <div className="flex items-center gap-1 font-sans">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <a href={`mailto:${reporter.email}`} className="hover:text-rose-700">
                    {reporter.email}
                  </a>
                </div>
              )}
              {reporter.twitter && (
                <div className="flex items-center gap-1 font-sans text-stone-700">
                  <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
                  <span>{reporter.twitter}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: Articles + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Main Content (8 cols) */}
        <main className="lg:col-span-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="text-lg font-bold text-stone-900 font-serif-bn">
              {isBn ? `${authorName} এর প্রতিবেদনসমূহ` : `Stories by ${authorName}`}
            </h2>
            <span className="text-xs text-stone-500 font-serif-bn">
              {isBn
                ? `দেখানো হচ্ছে ${toBengaliNumber(paginatedArticles.length)}টি সংবাদ`
                : `Showing ${paginatedArticles.length} stories`}
            </span>
          </div>

          {paginatedArticles.length === 0 ? (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
              <p className="text-stone-500 text-sm font-serif-bn">
                {isBn ? 'এই লেখকের কোনো প্রকাশিত প্রতিবেদন পাওয়া যায়নি।' : 'No published articles found for this author.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {paginatedArticles.map((story) => (
                <NewsCard key={story.id} article={story} variant="grid" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-stone-500 font-serif-bn">
                {isBn
                  ? `পৃষ্ঠা ${toBengaliNumber(currentPage)} এর ${toBengaliNumber(totalPages)}`
                  : `Page ${currentPage} of ${totalPages}`}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === 1
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isBn ? 'পূর্ববর্তী' : 'Previous'}</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isBn ? toBengaliNumber(pageNum) : pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-white border border-stone-300 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <span>{isBn ? 'পরবর্তী' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          <PopularNews limit={5} />
          <AdPlacement placement="sidebar" />

          {/* Other Reporters Widget */}
          {otherAuthors.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <h4 className="text-sm font-bold text-stone-900 font-serif-bn mb-4 pb-2 border-b border-stone-100">
                {isBn ? 'অন্যান্য সাংবাদিক ও প্রতিবেদক' : 'Other Journalists'}
              </h4>
              <div className="space-y-3">
                {otherAuthors.map((rep) => (
                  <Link
                    key={rep.id}
                    to={`/author/${rep.slug || rep.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors group"
                  >
                    <img
                      src={rep.avatar}
                      alt={rep.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-100 group-hover:ring-rose-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 group-hover:text-rose-700 font-serif-bn truncate">
                        {isBn ? rep.name : (rep.nameEn || rep.name)}
                      </p>
                      <p className="text-[11px] text-stone-500 font-sans truncate">
                        {isBn ? (rep.designation || rep.role) : rep.role}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <TodayPollWidget />
        </aside>

      </div>
    </>
  );
}

export default AuthorPage;

