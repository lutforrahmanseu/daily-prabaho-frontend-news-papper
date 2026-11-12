import { toBengaliNumber } from "./bengaliFormatter.js";
import { fetchWithTimeout } from "./fetchWithTimeout.js";

/**
 * Supported Bangladesh payment gateways (gateway tokens/redirects only, zero raw card data).
 */
export const BANGLADESH_GATEWAYS = [
  {
    code: "bkash",
    labelBn: "বিকাশ (bKash)",
    labelEn: "bKash Wallet",
    channelType: "mfs_wallet",
    accentBg:
      "bg-[#E2136E]/10 border-[#E2136E]/30 text-[#B80D58] dark:text-pink-300",
    badgeClass:
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800",
    descriptionBn: "সরাসরি বিকাশ ওয়ালেট থেকে পেমেন্ট করুন।",
    descriptionEn: "Pay directly via bKash Mobile Financial Service.",
    placeholderWallet: "017XXXXXXXX",
  },
  {
    code: "nagad",
    labelBn: "নগদ (Nagad)",
    labelEn: "Nagad Wallet",
    channelType: "mfs_wallet",
    accentBg:
      "bg-[#F37021]/10 border-[#F37021]/30 text-[#C8530E] dark:text-orange-300",
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    descriptionBn: "নগদ ডিজিটাল ওয়ালেটে নিরাপদ পেমেন্ট।",
    descriptionEn: "Fast digital wallet checkout via Nagad.",
    placeholderWallet: "018XXXXXXXX",
  },
  {
    code: "card",
    labelBn: "ব্যাংক কার্ড (হোস্টেড গেটওয়ে)",
    labelEn: "Hosted Card Checkout (SSLCommerz)",
    channelType: "hosted_card",
    accentBg:
      "bg-blue-600/10 border-blue-600/30 text-blue-700 dark:text-blue-300",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    descriptionBn:
      "ব্যাংক হোস্টেড সেশন (কার্ডের পূর্ণ নম্বর বা CVV নিউজফ্লো সংরক্ষণ করে না)।",
    descriptionEn:
      "Tokenized hosted card session (NewsFlow never stores card numbers or CVV).",
    placeholderWallet: "",
  },
];

export const CARD_BRANDS = ["VISA", "MASTERCARD", "AMEX", "NEXUS"];

/**
 * Forbidden raw card field names; checked both client-side and server-side.
 */
export const FORBIDDEN_RAW_CARD_FIELDS = [
  "card_number",
  "pan",
  "cvv",
  "cvc",
  "pin",
  "security_code",
  "expiry_month",
  "expiry_year",
  "expiry",
  "exp_month",
  "exp_year",
  "raw_card",
];

/**
 * Recursively detects forbidden raw card data keys in a payload object before submitting.
 * @param {unknown} payload
 * @returns {string[]}
 */
export function findForbiddenCardFields(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const hits = [];
  const walk = (obj) => {
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (obj && typeof obj === "object") {
      for (const [key, val] of Object.entries(obj)) {
        const lower = key.toLowerCase();
        if (FORBIDDEN_RAW_CARD_FIELDS.includes(lower)) {
          hits.push(lower);
        }
        if (val && typeof val === "object") {
          walk(val);
        }
      }
    }
  };
  walk(payload);
  return [...new Set(hits)];
}

export function formatBdt(amount, isBn = true) {
  const num = Number(amount || 0);
  const formatted = Number.isInteger(num)
    ? num.toLocaleString("en-US")
    : num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  if (isBn) {
    return `৳${toBengaliNumber(formatted)}`;
  }
  return `BDT ${formatted}`;
}

export function formatCtr(impressions, clicks) {
  const imp = Number(impressions || 0);
  const clk = Number(clicks || 0);
  if (imp <= 0) return "0.00%";
  return `${((clk / imp) * 100).toFixed(2)}%`;
}

export function getGatewayMeta(code) {
  return (
    BANGLADESH_GATEWAYS.find((g) => g.code === code) || {
      code: code || "unknown",
      labelBn:
        code === "free"
          ? "ফ্রি প্ল্যান"
          : String(code || "অজানা").toUpperCase(),
      labelEn:
        code === "free" ? "Free Plan" : String(code || "Unknown").toUpperCase(),
      badgeClass:
        "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700",
    }
  );
}

export const SUBSCRIPTION_STATUS_META = {
  active: {
    labelBn: "সক্রিয়",
    labelEn: "Active",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  pending_payment: {
    labelBn: "পেমেন্ট অপেক্ষমাণ",
    labelEn: "Pending Payment",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  cancelled: {
    labelBn: "বাতিলকৃত",
    labelEn: "Cancelled",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  },
  expired: {
    labelBn: "মেয়াদোত্তীর্ণ",
    labelEn: "Expired",
    badgeClass:
      "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700",
  },
  past_due: {
    labelBn: "বকেয়া",
    labelEn: "Past Due",
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  },
};

export const PAYMENT_STATUS_META = {
  pending: {
    labelBn: "অপেক্ষমাণ",
    labelEn: "Pending",
    badgeClass:
      "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300",
  },
  initiated: {
    labelBn: "শুরু হয়েছে",
    labelEn: "Initiated",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300",
  },
  verifying: {
    labelBn: "যাচাই চলছে",
    labelEn: "Verifying",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
  },
  succeeded: {
    labelBn: "সফল",
    labelEn: "Succeeded",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  failed: {
    labelBn: "ব্যর্থ",
    labelEn: "Failed",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300",
  },
  refunded: {
    labelBn: "রিফান্ড সম্পন্ন",
    labelEn: "Refunded",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300",
  },
  partially_refunded: {
    labelBn: "আংশিক রিফান্ড",
    labelEn: "Partial Refund",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300",
  },
  cancelled: {
    labelBn: "বাতিল",
    labelEn: "Cancelled",
    badgeClass:
      "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400",
  },
};

export const REFUND_STATUS_META = {
  pending: {
    labelBn: "পর্যালোচনাধীন",
    labelEn: "Pending Review",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
  },
  approved: {
    labelBn: "অনুমোদিত",
    labelEn: "Approved",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
  },
  processed: {
    labelBn: "রিফান্ড সম্পন্ন",
    labelEn: "Processed",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  rejected: {
    labelBn: "প্রত্যাখ্যাত",
    labelEn: "Rejected",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300",
  },
  failed: {
    labelBn: "ব্যর্থ",
    labelEn: "Failed",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300",
  },
};

export const APPROVAL_STATUS_META = {
  pending: {
    labelBn: "অপেক্ষমাণ",
    labelEn: "Pending",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
  },
  approved: {
    labelBn: "অনুমোদিত",
    labelEn: "Approved",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  changes_requested: {
    labelBn: "সংশোধন প্রয়োজন",
    labelEn: "Changes Requested",
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300",
  },
  rejected: {
    labelBn: "প্রত্যাখ্যাত",
    labelEn: "Rejected",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300",
  },
};

export const CAMPAIGN_STATUS_META = {
  draft: {
    labelBn: "খসড়া",
    labelEn: "Draft",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
  },
  pending_approval: {
    labelBn: "অনুমোদনের অপেক্ষায়",
    labelEn: "Pending Approval",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  active: {
    labelBn: "সক্রিয়",
    labelEn: "Active",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  paused: {
    labelBn: "বিরতি",
    labelEn: "Paused",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  completed: {
    labelBn: "সমাপ্ত",
    labelEn: "Completed",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  cancelled: {
    labelBn: "বাতিল",
    labelEn: "Cancelled",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const AD_PLACEMENT_LABELS = {
  homepage_top: {
    labelBn: "হোমপেজ শীর্ষ (৯৭০×৯০)",
    labelEn: "Homepage Top Banner (970×90)",
  },
  homepage_sidebar: {
    labelBn: "হোমপেজ সাইডবার (৩০০×২৫০)",
    labelEn: "Homepage Sidebar (300×250)",
  },
  news_details_top: {
    labelBn: "সংবাদ বিস্তারিত শীর্ষ (৭২৮×৯০)",
    labelEn: "Article Top (728×90)",
  },
  news_details_middle: {
    labelBn: "সংবাদ বিস্তারিত মধ্যভাগ (৭২৮×৯০)",
    labelEn: "Article In-Body (728×90)",
  },
  category_page: {
    labelBn: "বিভাগ পাতা (৭২৮×৯০)",
    labelEn: "Category Header (728×90)",
  },
  epaper_top: {
    labelBn: "ই-পেপার শীর্ষ (৭২৮×৯০)",
    labelEn: "E-Paper Top (728×90)",
  },
};

/**
 * Opens an authenticated backend-rendered HTML invoice in a clean popup/tab without exposing public endpoints.
 * @param {number|string} invoiceId
 * @param {boolean} isAdmin
 */
export async function openAuthorizedInvoiceHtml(invoiceId, isAdmin = false) {
  if (typeof window === "undefined") return;
  const apiBase = import.meta.env?.VITE_API_URL || "/api/v1";
  const token = isAdmin
    ? localStorage.getItem("auth_token")
    : localStorage.getItem("reader_token") ||
      localStorage.getItem("auth_token");
  const url = isAdmin
    ? `${apiBase}/admin/monetization/invoices/${invoiceId}/download`
    : `${apiBase}/reader/invoices/${invoiceId}/download`;

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "text/html",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Invoice download failed (${response.status})`);
  }

  const html = await response.text();
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
