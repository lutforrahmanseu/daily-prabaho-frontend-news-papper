import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { EDITORIAL_TRANSITION } from './MotionPrimitives.jsx';

/**
 * Enterprise Production React Error Boundary
 * Catches unhandled runtime exceptions in UI render tree,
 * logs errors, and presents a graceful localized fallback interface.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // In production, log to monitoring service (e.g. Sentry, Logstash)
    if (typeof window !== 'undefined' && window.__REPORT_ERROR__) {
      window.__REPORT_ERROR__(error, errorInfo);
    } else {
      console.error('[Daily Prabaho ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 sm:p-6 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={EDITORIAL_TRANSITION}
            className="max-w-lg w-full bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sm:p-8 text-center"
          >
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-rose-50/50">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Brand Title */}
            <h1 className="text-xl sm:text-2xl font-bold font-serif-bn text-stone-900 mb-2">
              দৈনিক বার্তা প্রবাহ
            </h1>

            {/* Localized Error Message */}
            <h2 className="text-lg font-semibold text-stone-800 mb-2">
              একটি অপ্রত্যাশিত ত্রুটি ঘটেছে
            </h2>
            <p className="text-sm text-stone-600 mb-6 font-serif-bn leading-relaxed">
              সাময়িক যান্ত্রিক ত্রুটির জন্য আমরা আন্তরিকভাবে দুঃখিত। পৃষ্ঠাটি পুনরায় লোড করুন অথবা প্রচ্ছদে ফিরে যান।
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-700 text-white font-medium text-sm rounded-lg hover:bg-rose-800 transition-colors shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পুনরায় চেষ্টা করুন (Retry)</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium text-sm rounded-lg transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>প্রচ্ছদে ফিরে যান (Home)</span>
              </button>
            </div>

            {/* Developer Diagnostics (Hidden in Production) */}
            {isDev && this.state.error && (
              <div className="mt-6 text-left p-4 bg-stone-900 text-stone-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 border border-stone-800">
                <p className="font-bold text-rose-400 mb-1">[Dev Error Details]</p>
                <p>{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[11px] text-stone-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

