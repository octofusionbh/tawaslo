const STORAGE_KEY = 'tawaslo.preview.reviews.v4';

const seed = {
  version: 4,
  settings: {
    enabled: true,
    headline: 'How was your experience with Marina?',
    googleUrl: 'https://g.page/r/marina-social-club/review',
    privatePrompt: 'Tell us what stood out or what we could do better.',
    followupOn: true,
  },
  share: { slug: 'marina-social-club-feedback' },
  touchpoints: {
    pointOfSaleQr: true,
    receiptQr: true,
    completedJourney: true,
    loyaltyReward: false,
  },
  reviews: [
    { id: 'review-1', source: 'google', rating: 5, name: 'Dana A.', when: 'Today · 8:42 PM', comment: 'Beautiful setting and thoughtful service. The whole experience felt effortless.', tags: ['experience', 'service'], status: 'unanswered', reply: '' },
    { id: 'review-2', source: 'direct', rating: 3, name: 'Yousef K.', when: 'Today · 7:18 PM', comment: 'The team was warm, but the handoff took longer than expected. I would still come back.', tags: ['speed', 'service'], status: 'needs-care', phone: '+973 3883 7710', reply: '' },
    { id: 'review-3', source: 'google', rating: 5, name: 'Layla Z.', when: 'Yesterday · 10:06 PM', comment: 'They remembered what I liked from last time. That small detail made the visit feel personal.', tags: ['loyalty', 'experience'], status: 'replied', reply: 'Thank you, Layla. We are delighted that the details made your return feel personal.' },
    { id: 'review-4', source: 'google', rating: 4, name: 'Mariam F.', when: 'Yesterday · 3:24 PM', comment: 'Excellent quality and a helpful team. Checkout could have been a little quicker.', tags: ['quality', 'speed'], status: 'unanswered', reply: '' },
    { id: 'review-5', source: 'direct', rating: 2, name: 'Hassan M.', when: '24 Aug · 9:11 PM', comment: 'I waited longer than expected even though everything was arranged in advance.', tags: ['wait time', 'journey'], status: 'needs-care', phone: '+973 3601 8426', reply: '' },
    { id: 'review-6', source: 'google', rating: 5, name: 'Noura S.', when: '23 Aug · 1:09 PM', comment: 'A polished experience from start to finish. I have already recommended it to friends.', tags: ['recommendation', 'quality'], status: 'replied', reply: 'This made our day, Noura. Thank you for recommending us and for taking time to share it.' },
  ],
};

const clone = value => JSON.parse(JSON.stringify(value));

export function normalizeReviewsPreview(value) {
  const fallback = clone(seed);
  const reviews = Array.isArray(value?.reviews) && value.reviews.length ? value.reviews : fallback.reviews;
  return {
    version: 4,
    settings: { ...fallback.settings, ...(value?.settings || {}) },
    share: { ...fallback.share, ...(value?.share || {}) },
    touchpoints: { ...fallback.touchpoints, ...(value?.touchpoints || {}) },
    reviews: reviews.map((review, index) => ({
      id: review.id || `review-${index + 1}`,
      source: review.source === 'google' ? 'google' : 'direct',
      rating: Math.min(5, Math.max(1, Number(review.rating) || 1)),
      name: String(review.name || 'Customer'),
      when: String(review.when || 'Recently'),
      comment: String(review.comment || ''),
      tags: Array.isArray(review.tags) ? review.tags.slice(0, 4) : [],
      status: ['unanswered', 'needs-care', 'draft', 'replied'].includes(review.status) ? review.status : 'unanswered',
      phone: String(review.phone || ''),
      reply: String(review.reply || ''),
    })),
  };
}

export function readReviewsPreview() {
  if (typeof window === 'undefined') return normalizeReviewsPreview(seed);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return normalizeReviewsPreview(stored ? JSON.parse(stored) : seed);
  } catch (_) {
    return normalizeReviewsPreview(seed);
  }
}

export function saveReviewsPreview(value) {
  const next = normalizeReviewsPreview(value);
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
  }
  return next;
}

export function reviewsSummary(value) {
  const data = normalizeReviewsPreview(value);
  const count = data.reviews.length;
  const average = count ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
  const directCount = data.reviews.filter(review => review.source === 'direct').length;
  const needsReply = data.reviews.filter(review => review.status !== 'replied').length;
  const publicCount = data.reviews.filter(review => review.source === 'google').length;
  const promoters = data.reviews.filter(review => review.rating >= 4).length;
  const replied = data.reviews.filter(review => review.status === 'replied').length;
  const recommendation = count ? Math.round((promoters / count) * 100) : 0;
  const responseRate = count ? Math.round((replied / count) * 100) : 0;
  const distribution = [5, 4, 3, 2, 1].map(rating => ({ rating, count: data.reviews.filter(review => review.rating === rating).length }));
  return { count, average, directCount, publicCount, needsReply, recommendation, responseRate, distribution };
}

export function updateReviewItem(value, id, patch) {
  const data = normalizeReviewsPreview(value);
  return normalizeReviewsPreview({ ...data, reviews: data.reviews.map(review => review.id === id ? { ...review, ...patch } : review) });
}

export function updateReviewSettings(value, patch) {
  const data = normalizeReviewsPreview(value);
  return normalizeReviewsPreview({ ...data, settings: { ...data.settings, ...patch } });
}

export function updateReviewTouchpoints(value, patch) {
  const data = normalizeReviewsPreview(value);
  return normalizeReviewsPreview({ ...data, touchpoints: { ...data.touchpoints, ...patch } });
}
