import React from 'react';

/**
 * Reusable Button component with multiple variants, sizes, and states
 */
export function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  onClick,
  type = 'button',
  ariaLabel,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap select-none';

  const variants = {
    default: 'bg-rose-700 text-white hover:bg-rose-800 shadow-xs active:scale-[0.99]',
    primary: 'bg-stone-900 text-white hover:bg-black active:scale-[0.99]',
    secondary: 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200',
    outline: 'border border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900',
    ghost: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-xs',
    subtle: 'bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold'
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 rounded gap-1',
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2 rounded-md gap-2',
    lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5',
    icon: 'p-2 rounded-md'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
