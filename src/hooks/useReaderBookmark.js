import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../store/newsSlice.js';
import { selectIsReaderAuthenticated } from '../store/readerSlice.js';
import {
  useGetReaderBookmarksQuery,
  useToggleReaderBookmarkMutation
} from '../store/api/readerApi.js';

/**
 * Unified bookmark hook syncing PostgreSQL bookmarks for authenticated readers
 * while retaining seamless local bookmarks for guests.
 */
export function useReaderBookmark(article) {
  const dispatch = useDispatch();
  const isReaderAuth = useSelector(selectIsReaderAuthenticated);
  const localSavedIds = useSelector((state) => state.news.savedArticleIds);

  const { data: serverBookmarks } = useGetReaderBookmarksQuery(undefined, {
    skip: !isReaderAuth
  });
  const [triggerToggle, { isLoading: isToggling }] = useToggleReaderBookmarkMutation();

  const serverBookmarkIds = serverBookmarks?.bookmarkIds || [];

  const isBookmarked = useMemo(() => {
    if (!article) return false;
    if (isReaderAuth) {
      return serverBookmarkIds.includes(Number(article.id));
    }
    return localSavedIds.includes(article.id);
  }, [article, isReaderAuth, serverBookmarkIds, localSavedIds]);

  const savedCount = isReaderAuth ? serverBookmarkIds.length : localSavedIds.length;

  const toggle = useCallback(
    async (targetArticle = article) => {
      if (!targetArticle) return;
      if (isReaderAuth && targetArticle.id && !Number.isNaN(Number(targetArticle.id))) {
        try {
          await triggerToggle({ news_id: Number(targetArticle.id), toggle: true }).unwrap();
          return;
        } catch {
          // Graceful fallback if slug-based lookup needed
          if (targetArticle.slug) {
            await triggerToggle({ slug: targetArticle.slug, toggle: true }).catch(() => {});
          }
          return;
        }
      }
      dispatch(toggleBookmark(targetArticle.id));
    },
    [article, isReaderAuth, triggerToggle, dispatch]
  );

  return {
    isBookmarked,
    savedCount,
    savedItems: serverBookmarks?.items || [],
    isReaderAuth,
    isToggling,
    toggle
  };
}

