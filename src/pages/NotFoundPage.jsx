import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Newspaper, Home } from 'lucide-react';
import Button from '../components/Button.jsx';

export function NotFoundPage() {
  const language = useSelector((state) => state.ui?.language || 'bn');
  const isBn = language === 'bn';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
        <Newspaper className="w-8 h-8" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold font-serif-bn text-stone-900 tracking-tight">
        {isBn ? '৪০৪ – পৃষ্ঠাটি পাওয়া যায়নি' : '404 – Page Not Found'}
      </h1>
      <p className="text-sm sm:text-base text-stone-600 max-w-md mt-2 font-serif-bn leading-relaxed">
        {isBn
          ? 'আপনি যে সংবাদ বা পৃষ্ঠাটি খুঁজছেন তা সরিয়ে ফেলা হয়েছে অথবা লিংকটিতে কোনো ত্রুটি রয়েছে।'
          : 'The article or page you are looking for has been moved or the link is invalid.'}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="default" className="font-bold gap-1.5">
            <Home className="w-4 h-4" />
            <span>{isBn ? 'প্রচ্ছদে ফিরে যান' : 'Back to Home'}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
