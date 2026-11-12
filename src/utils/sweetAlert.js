/**
 * Unified SweetAlert modal queue and Promise API for Daily Prabaho.
 * Zero external runtime dependencies; driven by <SweetAlertHost /> mounted in App.jsx.
 */

const queue = [];
const listeners = new Set();

function notifyListeners() {
  const snapshot = {
    current: queue[0]?.payload || null,
    queueLength: queue.length
  };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // Ignore failing subscribers to keep alert queue healthy
    }
  });
}

function normalizeMessageArgs(defaultTitle, titleOrOptions, text, extraOptions = {}) {
  if (titleOrOptions && typeof titleOrOptions === 'object' && !Array.isArray(titleOrOptions)) {
    return {
      title: defaultTitle,
      ...titleOrOptions
    };
  }

  if (typeof titleOrOptions === 'string' && typeof text === 'string') {
    return {
      title: titleOrOptions,
      text,
      ...extraOptions
    };
  }

  if (typeof titleOrOptions === 'string') {
    return {
      title: defaultTitle,
      text: titleOrOptions,
      ...((text && typeof text === 'object') ? text : extraOptions)
    };
  }

  return {
    title: defaultTitle,
    ...extraOptions
  };
}

function normalizeFireArgs(optionsOrTitle, textArg, iconArg) {
  if (optionsOrTitle && typeof optionsOrTitle === 'object') {
    return { ...optionsOrTitle };
  }

  return {
    title: typeof optionsOrTitle === 'string' ? optionsOrTitle : '',
    text: typeof textArg === 'string' ? textArg : '',
    ...(typeof iconArg === 'string' ? { icon: iconArg } : {})
  };
}

export function subscribeSweetAlert(listener) {
  listeners.add(listener);
  listener({
    current: queue[0]?.payload || null,
    queueLength: queue.length
  });
  return () => {
    listeners.delete(listener);
  };
}

export function resolveCurrentAlert(result = {}) {
  const head = queue.shift();
  if (!head) return;

  const isConfirmed = Boolean(result.isConfirmed);
  head.resolve({
    isConfirmed,
    isDenied: Boolean(result.isDenied),
    isDismissed: !isConfirmed,
    dismiss: !isConfirmed ? (result.dismiss || 'close') : undefined
  });

  notifyListeners();
}

export function _resetSweetAlerts() {
  while (queue.length > 0) {
    const item = queue.shift();
    item.resolve({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
      dismiss: 'reset'
    });
  }
  notifyListeners();
}

export function fire(optionsOrTitle, textArg, iconArg) {
  const raw = normalizeFireArgs(optionsOrTitle, textArg, iconArg);

  // Safe fallback in headless Node/SSR environments where no UI host is mounted
  if (listeners.size === 0 && typeof document === 'undefined') {
    return Promise.resolve({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
      dismiss: 'no-host'
    });
  }

  const payload = {
    id: `swal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    icon: raw.icon || 'info',
    title: raw.title || '',
    text: raw.text || '',
    showConfirmButton: raw.showConfirmButton !== false,
    showCancelButton: Boolean(raw.showCancelButton),
    confirmButtonText: raw.confirmButtonText || 'ঠিক আছে',
    cancelButtonText: raw.cancelButtonText || 'বাতিল',
    confirmVariant: raw.confirmVariant || (raw.icon === 'error' ? 'danger' : 'primary'),
    allowOutsideClick: raw.allowOutsideClick !== undefined ? Boolean(raw.allowOutsideClick) : !raw.showCancelButton,
    allowEscapeKey: raw.allowEscapeKey !== undefined ? Boolean(raw.allowEscapeKey) : true,
    timer: Number(raw.timer) > 0 ? Number(raw.timer) : 0,
    timerProgressBar: raw.timerProgressBar !== undefined ? Boolean(raw.timerProgressBar) : Number(raw.timer) > 0
  };

  return new Promise((resolve) => {
    queue.push({ payload, resolve });
    notifyListeners();
  });
}

export function success(titleOrOptions, text, extraOptions = {}) {
  const opts = normalizeMessageArgs('সফল হয়েছে!', titleOrOptions, text, extraOptions);
  return fire({
    icon: 'success',
    confirmButtonText: 'ঠিক আছে',
    confirmVariant: 'success',
    timer: 2600,
    timerProgressBar: true,
    ...opts
  });
}

export function error(titleOrOptions, text, extraOptions = {}) {
  const opts = normalizeMessageArgs('ব্যর্থ হয়েছে!', titleOrOptions, text, extraOptions);
  return fire({
    icon: 'error',
    confirmButtonText: 'ঠিক আছে',
    confirmVariant: 'danger',
    timer: 0,
    ...opts
  });
}

export function warning(titleOrOptions, text, extraOptions = {}) {
  const opts = normalizeMessageArgs('সতর্কতা', titleOrOptions, text, extraOptions);
  return fire({
    icon: 'warning',
    confirmButtonText: 'ঠিক আছে',
    confirmVariant: 'warning',
    timer: 0,
    ...opts
  });
}

export function info(titleOrOptions, text, extraOptions = {}) {
  const opts = normalizeMessageArgs('তথ্য', titleOrOptions, text, extraOptions);
  return fire({
    icon: 'info',
    confirmButtonText: 'ঠিক আছে',
    confirmVariant: 'primary',
    timer: 2800,
    timerProgressBar: true,
    ...opts
  });
}

export function confirm(titleOrOptions, text, extraOptions = {}) {
  const opts = normalizeMessageArgs('আপনি কি নিশ্চিত?', titleOrOptions, text, extraOptions);
  return fire({
    icon: 'question',
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: 'হ্যাঁ, নিশ্চিত',
    cancelButtonText: 'বাতিল',
    confirmVariant: 'primary',
    allowOutsideClick: false,
    timer: 0,
    ...opts
  });
}

export function confirmDelete(itemLabel, customText, extraOptions = {}) {
  if (itemLabel && typeof itemLabel === 'object') {
    return confirm({
      title: 'মুছে ফেলতে চান?',
      icon: 'warning',
      confirmButtonText: 'হ্যাঁ, মুছে ফেলুন',
      cancelButtonText: 'বাতিল',
      confirmVariant: 'danger',
      ...itemLabel
    });
  }

  const defaultText = itemLabel
    ? `আপনি কি নিশ্চিত যে "${itemLabel}" স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে নেওয়া যাবে না।`
    : 'আপনি কি নিশ্চিত যে তথ্যটি স্থায়ীভাবে মুছে ফেলতে চান?';

  return confirm({
    title: 'মুছে ফেলতে চান?',
    text: customText || defaultText,
    icon: 'warning',
    confirmButtonText: 'হ্যাঁ, মুছে ফেলুন',
    cancelButtonText: 'বাতিল',
    confirmVariant: 'danger',
    ...extraOptions
  });
}

const sweetAlert = {
  fire,
  success,
  error,
  warning,
  info,
  confirm,
  confirmDelete,
  subscribe: subscribeSweetAlert,
  resolveCurrent: resolveCurrentAlert,
  reset: _resetSweetAlerts
};

export default sweetAlert;

