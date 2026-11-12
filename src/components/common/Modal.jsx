import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MotionOverlay } from './MotionPrimitives.jsx';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <MotionOverlay
      isOpen={isOpen}
      onBackdropClick={onClose}
      wrapperClassName="z-50 p-4 sm:p-6 overflow-y-auto"
      backdropClassName="bg-black/60 backdrop-blur-xs"
      panelClassName={`w-full ${maxWidth} bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden my-8 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
        <h3 className="text-lg font-bold text-stone-900 font-serif-bn">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        {children}
      </div>
    </MotionOverlay>
  );
}

export default Modal;
