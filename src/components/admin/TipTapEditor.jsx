import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  Sparkles
} from 'lucide-react';
import { toBengaliNumber, calculateReadingTime } from '../../utils/bengaliFormatter.js';

export function TipTapEditor({
  content = '',
  onChange,
  placeholder = 'সংবাদের বিস্তারিত বিবরণ এখানে লিখুন...',
  minHeight = '280px'
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-rose-700 underline font-semibold',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-stone-200'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none focus:outline-none p-4 text-sm font-serif-bn leading-relaxed text-stone-900 min-h-[220px]'
      }
    }
  });

  // Keep editor content in sync when initial content changes externally (e.g. loading articleToEdit)
  useEffect(() => {
    if (editor && content !== undefined) {
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content || '', false);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full border border-stone-200 rounded-xl p-6 bg-stone-50 text-center text-xs text-stone-400">
        এডিটর লোড হচ্ছে...
      </div>
    );
  }

  // Calculate live word count
  const rawText = editor.getText();
  const wordsCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const readingTimeEstimate = calculateReadingTime(rawText);

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('ওয়েবসাইট বা সংবাদের ইউআরএল (URL) লিখুন:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt(
      'ছবির সরাসরি লিংক (Image URL) প্রদান করুন:',
      'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&auto=format&fit=crop&q=80'
    );

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="w-full border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-transparent transition-all">
      
      {/* Editor Toolbar */}
      <div className="bg-stone-50 border-b border-stone-200 p-2 flex flex-wrap items-center gap-1 text-stone-700">
        
        {/* Headings */}
        <div className="flex items-center border-r border-stone-200 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="হেডিং ২ (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="হেডিং ৩ (H3)"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              editor.isActive('heading', { level: 4 })
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="হেডিং ৪ (H4)"
          >
            <Heading4 className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center border-r border-stone-200 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('bold')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="বোল্ড (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('italic')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="ইটালিক (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('strike')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="স্ট্রাইকথ্রু"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('code')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="ইনলাইন কোড"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Blocks */}
        <div className="flex items-center border-r border-stone-200 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="বুলেট তালিকা"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="সংখ্যাযুক্ত তালিকা"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="উদ্ধৃতি (Blockquote)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 transition-colors"
            title="অনুচ্ছেদ বিভাজক লাইন (Divider)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Links & Images */}
        <div className="flex items-center border-r border-stone-200 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('link')
                ? 'bg-rose-700 text-white shadow-xs'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="লিংক যুক্ত করুন"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded-lg hover:bg-stone-200 text-rose-700 transition-colors"
              title="লিংক অপসারণ করুন"
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={addImage}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 transition-colors"
            title="নিবন্ধের ভেতর ছবি যুক্ত করুন"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 disabled:opacity-40 transition-colors"
            title="পূর্বাবস্থায় ফিরুন (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 disabled:opacity-40 transition-colors"
            title="পুনরায় করুন (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Editor Content Area */}
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer Word Count & Read Time */}
      <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 flex items-center justify-between text-[11px] text-stone-500 font-mono">
        <div className="flex items-center gap-3">
          <span>মোট শব্দ: <strong className="text-stone-800">{toBengaliNumber(wordsCount)}</strong></span>
          <span>•</span>
          <span>পাঠের সময়: <strong className="text-stone-800">{readingTimeEstimate}</strong></span>
        </div>
        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>টিপট্যাপ এডিটর সক্রিয়</span>
        </span>
      </div>

    </div>
  );
}

export default TipTapEditor;

