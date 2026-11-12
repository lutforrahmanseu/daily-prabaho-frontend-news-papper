import React from 'react';
import { Quote } from 'lucide-react';
import { extractHtmlBlocks, isHtmlContent, sanitizeHtml } from '../../utils/securitySanitizer.js';

/**
 * Renders both sanitized TipTap/CMS HTML bodies and plain-text/Markdown-lite articles safely.
 */
export function RichArticleBody({
  content = '',
  paragraphClassName = 'text-base sm:text-lg leading-relaxed',
  className = '',
  emptyFallback = '',
  renderAfterBlock = null
}) {
  const raw = typeof content === 'string' && content.trim() ? content : emptyFallback;
  if (!raw) return null;

  if (isHtmlContent(raw)) {
    const blocks = extractHtmlBlocks(raw);
    return (
      <div className={`space-y-5 font-serif-bn text-stone-900 ${className}`}>
        {blocks.map((blockHtml, index) => (
          <React.Fragment key={index}>
            <div
              className={`rich-article-block text-stone-800 ${paragraphClassName}`}
              dangerouslySetInnerHTML={{ __html: blockHtml }}
            />
            {renderAfterBlock?.(index, blocks.length)}
          </React.Fragment>
        ))}
      </div>
    );
  }

  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-6 font-serif-bn text-stone-900 ${className}`}>
      {paragraphs.map((paragraph, index) => {
        let blockNode;

        if (paragraph.startsWith('>')) {
          const quoteText = paragraph.replace(/^>\s*/gm, '');
          blockNode = (
            <blockquote className="relative my-6 p-4 sm:p-6 bg-gradient-to-r from-rose-50/60 to-stone-50 border-l-4 border-rose-700 rounded-r-xl">
              <Quote className="w-8 h-8 text-rose-700/20 absolute top-3 right-4" />
              <p className="text-lg sm:text-xl font-bold text-stone-900 italic leading-relaxed">
                {quoteText}
              </p>
            </blockquote>
          );
        } else if (paragraph.startsWith('###')) {
          const headingText = paragraph.replace(/^###\s*/, '');
          blockNode = (
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-bn pt-3 pb-1 border-b border-stone-100">
              {headingText}
            </h3>
          );
        } else if (paragraph.startsWith('*') || paragraph.startsWith('-')) {
          const items = paragraph.split('\n').filter(Boolean);
          blockNode = (
            <ul className="space-y-2 pl-4 list-disc list-inside text-stone-800 text-base sm:text-lg">
              {items.map((it, i) => (
                <li key={i} className="leading-relaxed">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        it.replace(/^[*-]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      )
                    }}
                  />
                </li>
              ))}
            </ul>
          );
        } else {
          blockNode = (
            <p className={`${paragraphClassName} text-stone-800 text-justify sm:text-left`}>
              {paragraph}
            </p>
          );
        }

        return (
          <React.Fragment key={index}>
            {blockNode}
            {renderAfterBlock?.(index, paragraphs.length)}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default RichArticleBody;
