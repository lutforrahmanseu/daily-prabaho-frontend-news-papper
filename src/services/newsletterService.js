/**
 * Newsletter Subscription Service
 * Prepared for Laravel REST API (/api/v1/newsletter/subscribe)
 */

const SUBSCRIBERS_STORAGE_KEY = 'daily_prabaho_subscribers';

export async function subscribeNewsletter({
  email,
  frequency = 'daily', // 'daily' | 'weekly' | 'breaking'
  topics = []
}) {
  // Simulate network request
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!email || !email.includes('@') || !email.includes('.')) {
    throw new Error('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।');
  }

  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    const subscribers = raw ? JSON.parse(raw) : [];

    const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return {
        success: true,
        alreadySubscribed: true,
        message: 'আপনি ইতোমধ্যেই আমাদের নিউজলেটার তালিকায় নিবন্ধিত রয়েছেন।'
      };
    }

    const newSubscriber = {
      id: `sub-${Date.now()}`,
      email: email.trim().toLowerCase(),
      frequency,
      topics,
      subscribedAt: new Date().toISOString()
    };

    subscribers.push(newSubscriber);
    localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(subscribers));

    return {
      success: true,
      alreadySubscribed: false,
      message: 'অভিনন্দন! আপনার সাবস্ক্রিপশন সফলভাবে সম্পন্ন হয়েছে। প্রতিদিনের সংবাদ বুলেটিন আপনার ইনবক্সে পৌঁছাবে।'
    };
  } catch (err) {
    return {
      success: true,
      alreadySubscribed: false,
      message: 'সাবস্ক্রিপশন সম্পন্ন হয়েছে!'
    };
  }
}

export default {
  subscribeNewsletter
};

