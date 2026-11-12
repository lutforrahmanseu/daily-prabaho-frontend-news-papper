import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Shared editorial motion curve & duration tokens for Daily Prabaho.
 * Tuned for brisk, readable transitions without exaggerated bounce.
 */
export const EDITORIAL_EASE = [0.22, 1, 0.36, 1];
export const EDITORIAL_TRANSITION = { duration: 0.28, ease: EDITORIAL_EASE };
export const FAST_TRANSITION = { duration: 0.18, ease: EDITORIAL_EASE };
export const SPRING_SNAPPY = { type: 'spring', stiffness: 460, damping: 34 };

/**
 * Subtle fade-and-rise reveal for editorial sections and admin panels.
 */
export function EditorialReveal({
  children,
  className = '',
  delay = 0,
  immediate = false,
  y = 14,
  as = 'div'
}) {
  const Component = motion[as] || motion.div;

  if (immediate) {
    return (
      <Component
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay, ease: EDITORIAL_EASE }}
        className={className}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.32, delay, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </Component>
  );
}

/**
 * Coordinated container for staggered headline/KPI card grids.
 */
export function MotionStaggerGrid({
  children,
  className = '',
  stagger = 0.045,
  delayChildren = 0.02,
  immediate = false
}) {
  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren
      }
    }
  };

  if (immediate) {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.06 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Child item paired with MotionStaggerGrid.
 */
export function MotionStaggerItem({ children, className = '', y = 10 }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.26, ease: EDITORIAL_EASE }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared animated overlay + dialog panel supporting smooth mount & exit transitions.
 */
export function MotionOverlay({
  isOpen,
  onBackdropClick,
  wrapperClassName = 'z-50 p-4 sm:p-6 overflow-y-auto',
  backdropClassName = 'bg-black/60 backdrop-blur-xs',
  panelClassName = '',
  panelKey = 'dialog',
  role = 'dialog',
  ariaModal = true,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  onPanelMouseEnter,
  onPanelMouseLeave,
  children
}) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          key={panelKey}
          className={`fixed inset-0 flex items-center justify-center ${wrapperClassName}`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FAST_TRANSITION}
            className={`fixed inset-0 ${backdropClassName}`}
            onClick={onBackdropClick}
            aria-hidden="true"
          />
          <motion.div
            role={role}
            aria-modal={ariaModal}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            onMouseEnter={onPanelMouseEnter}
            onMouseLeave={onPanelMouseLeave}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
            className={`relative z-10 ${panelClassName}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Slide-in drawer overlay supporting both left and right drawers with smooth exit.
 */
export function MotionDrawerOverlay({
  isOpen,
  onBackdropClick,
  side = 'right',
  wrapperClassName = 'z-50',
  backdropClassName = 'bg-stone-950/60 backdrop-blur-xs',
  panelClassName = '',
  role = 'dialog',
  ariaModal = true,
  children
}) {
  const closedX = side === 'left' ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 flex ${side === 'left' ? 'justify-start' : 'justify-end'} ${wrapperClassName}`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FAST_TRANSITION}
            className={`fixed inset-0 ${backdropClassName}`}
            onClick={onBackdropClick}
            aria-hidden="true"
          />
          <motion.div
            role={role}
            aria-modal={ariaModal}
            initial={{ x: closedX }}
            animate={{ x: 0 }}
            exit={{ x: closedX }}
            transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
            className={`relative z-10 ${panelClassName}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact animated popover dropdown for top-bar menus and notifications.
 */
export function MotionDropdown({ isOpen, origin = 'top right', className = '', children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={FAST_TRANSITION}
          style={{ transformOrigin: origin }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
