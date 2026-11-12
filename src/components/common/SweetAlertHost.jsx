import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle
} from 'lucide-react';
import { resolveCurrentAlert, subscribeSweetAlert } from '../../utils/sweetAlert.js';
import { MotionOverlay, SPRING_SNAPPY } from './MotionPrimitives.jsx';

const ICON_CONFIG = {
  success: {
    ringClass: 'bg-emerald-50 text-emerald-600 ring-8 ring-emerald-100/80',
    accentBar: 'bg-emerald-600',
    Icon: CheckCircle2
  },
  error: {
    ringClass: 'bg-rose-50 text-rose-600 ring-8 ring-rose-100/80',
    accentBar: 'bg-rose-600',
    Icon: XCircle
  },
  warning: {
    ringClass: 'bg-amber-50 text-amber-600 ring-8 ring-amber-100/80',
    accentBar: 'bg-amber-500',
    Icon: AlertTriangle
  },
  info: {
    ringClass: 'bg-sky-50 text-sky-600 ring-8 ring-sky-100/80',
    accentBar: 'bg-sky-600',
    Icon: Info
  },
  question: {
    ringClass: 'bg-rose-50 text-rose-700 ring-8 ring-rose-100/80',
    accentBar: 'bg-rose-700',
    Icon: HelpCircle
  }
};

const CONFIRM_VARIANT_CLASSES = {
  primary: 'bg-rose-700 hover:bg-rose-800 focus:ring-rose-500 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white',
  danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white'
};

/**
 * Global SweetAlert modal presenter mounted once at the application root.
 */
export function SweetAlertHost() {
  const [alertState, setAlertState] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    return subscribeSweetAlert(({ current }) => {
      setAlertState(current);
      setIsPaused(false);
    });
  }, []);

  // Keyboard shortcuts (Escape) & safe focus placement
  useEffect(() => {
    if (!alertState) return undefined;

    const focusTimer = setTimeout(() => {
      if (alertState.showCancelButton && alertState.confirmVariant === 'danger' && cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      } else if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 20);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && alertState.allowEscapeKey) {
        e.preventDefault();
        resolveCurrentAlert({ isConfirmed: false, dismiss: 'esc' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [alertState]);

  // Optional auto-close timer for transient success/info notifications
  useEffect(() => {
    if (!alertState || !alertState.timer || isPaused) return undefined;

    const timerId = setTimeout(() => {
      resolveCurrentAlert({ isConfirmed: false, dismiss: 'timer' });
    }, alertState.timer);

    return () => clearTimeout(timerId);
  }, [alertState, isPaused]);

  const iconMeta = ICON_CONFIG[alertState?.icon] || ICON_CONFIG.info;
  const IconComponent = iconMeta.Icon;
  const confirmBtnClass =
    CONFIRM_VARIANT_CLASSES[alertState?.confirmVariant] || CONFIRM_VARIANT_CLASSES.primary;

  const handleBackdropClick = () => {
    if (alertState?.allowOutsideClick) {
      resolveCurrentAlert({ isConfirmed: false, dismiss: 'backdrop' });
    }
  };

  return (
    <MotionOverlay
      isOpen={Boolean(alertState)}
      panelKey={alertState?.id || 'swal'}
      onBackdropClick={handleBackdropClick}
      ariaLabelledBy="swal-dialog-title"
      ariaDescribedBy={alertState?.text ? 'swal-dialog-text' : undefined}
      onPanelMouseEnter={() => setIsPaused(true)}
      onPanelMouseLeave={() => setIsPaused(false)}
      wrapperClassName="z-[1000] p-4 font-sans"
      backdropClassName="bg-stone-950/65 backdrop-blur-xs"
      panelClassName="w-full max-w-md overflow-hidden rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 sm:p-7 text-center"
    >
      {alertState && (
        <>
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_SNAPPY}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${iconMeta.ringClass}`}
            >
              <IconComponent className="w-8 h-8" strokeWidth={2.2} />
            </motion.div>
          </div>

          {alertState.title && (
            <h2
              id="swal-dialog-title"
              className="text-xl font-black font-serif-bn text-stone-900 leading-snug"
            >
              {alertState.title}
            </h2>
          )}

          {alertState.text && (
            <p
              id="swal-dialog-text"
              className="mt-2.5 text-sm text-stone-600 leading-relaxed whitespace-pre-line"
            >
              {alertState.text}
            </p>
          )}

          {(alertState.showConfirmButton || alertState.showCancelButton) && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {alertState.showCancelButton && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  ref={cancelBtnRef}
                  type="button"
                  onClick={() => resolveCurrentAlert({ isConfirmed: false, dismiss: 'cancel' })}
                  className="min-w-[110px] px-5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 cursor-pointer"
                >
                  {alertState.cancelButtonText}
                </motion.button>
              )}

              {alertState.showConfirmButton && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  ref={confirmBtnRef}
                  type="button"
                  onClick={() => resolveCurrentAlert({ isConfirmed: true })}
                  className={`min-w-[120px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${confirmBtnClass}`}
                >
                  {alertState.confirmButtonText}
                </motion.button>
              )}
            </div>
          )}

          {alertState.timer > 0 && alertState.timerProgressBar && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100 overflow-hidden">
              <div
                key={alertState.id}
                className={`h-full origin-left ${iconMeta.accentBar} transition-all ease-linear`}
                style={{
                  width: isPaused ? '100%' : '0%',
                  transitionDuration: isPaused ? '0ms' : `${alertState.timer}ms`
                }}
              />
            </div>
          )}
        </>
      )}
    </MotionOverlay>
  );
}

export default SweetAlertHost;

