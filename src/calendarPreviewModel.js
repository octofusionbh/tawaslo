// Design-preview data only. This module never reads or writes live client records.
export const CALENDAR_PREVIEW_KEY = 'tw_calendar_design_v1';
export const CALENDAR_STATUS = {
  pending: 'Awaiting review', approved: 'Approved', changes: 'Changes requested', draft: 'Draft', revised: 'Updated for review',
};
export const CALENDAR_NETWORKS = { ig: 'Instagram', fb: 'Facebook', li: 'LinkedIn', tt: 'TikTok' };
export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export function parseCalendarMonth(value, fallback = new Date()) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || '')) return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  const [y, m] = value.split('-').map(Number);
  return new Date(y, m - 1, 1);
}
export function calendarDays(date) {
  const y = date.getFullYear(), m = date.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const length = Math.ceil((offset + new Date(y, m + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length }, (_, i) => new Date(y, m, i - offset + 1));
}
export function seedCalendar(date = new Date()) {
  const month = monthKey(date);
  const items = [
    [2, '18:00', 'ig', 'Post', 'Golden hour, reserved.', 'sunset', 'approved', 'Your favourite view, with a table waiting. Join us by the water from 5 PM. Reserve through the link in our bio.'],
    [4, '12:30', 'fb', 'Post', 'A slower kind of Sunday.', 'table', 'approved', 'Long lunches. Good company. Nowhere else to be. Make a little room for a Sunday at Marina Social Club.'],
    [6, '17:00', 'ig', 'Carousel', 'A table for every mood.', 'menu', 'pending', 'The terrace, the dining room, or a quiet corner by the sea. Swipe to find your spot. Which one feels like you?'],
    [8, '18:30', 'tt', 'Reel', 'From the kitchen, with love.', 'kitchen', 'pending', 'A little heat. A lot of heart. Come behind the scenes with our kitchen team at Marina Social Club.'],
    [11, '13:00', 'ig', 'Post', 'Lunch, without the rush.', 'table', 'changes', 'Step away from the everyday. Our new lunch menu is ready when you are. Join us from 12 PM.'],
    [13, '17:30', 'ig', 'Story', 'Your weekend starts here.', 'sunset', 'pending', 'A sea breeze and your favourite seat. Book your weekend table at Marina Social Club.'],
    [16, '09:30', 'li', 'Post', 'The people behind the place.', 'kitchen', 'approved', 'Hospitality is a team effort. This month, we are celebrating the people who make every visit feel personal. Meet the team behind Marina Social Club.'],
    [18, '18:00', 'ig', 'Carousel', 'Something worth sharing.', 'menu', 'pending', 'Made for the middle of the table. Explore our sharing menu and bring your favourite people. Good food is even better together.'],
    [20, '16:00', 'fb', 'Post', 'The table is yours.', 'sea', 'pending', 'Small celebrations deserve a beautiful setting. Plan your next gathering with us by the water. Message our team to find out more.'],
    [23, '18:30', 'ig', 'Reel', 'Stay for the sunset.', 'sunset', 'pending', 'When the light changes, stay a little longer. An evening at Marina Social Club, from the first sip to the last glow.'],
    [25, '12:00', 'ig', 'Post', 'A fresh chapter.', 'sea', 'draft', 'A new season of flavours is on its way. More from our kitchen soon.'],
    [28, '18:00', 'fb', 'Post', 'See you by the sea.', 'menu', 'draft', 'Same place. A new reason to visit. Save a seat for next month at Marina Social Club.'],
  ];
  const posts = items.map(([day, time, platform, format, title, art, status, caption], i) => ({
    id: `sample-${month}-${i + 1}`, day, time, platform, format, title, art, status, caption,
    version: 1, notes: status === 'changes' ? [{ author: 'Client', text: 'Please mention that the lunch menu is available Sunday to Thursday.', kind: 'changes' }] : [],
  }));
  return { month, posts, sharedIds: posts.filter(p => p.status !== 'draft').map(p => p.id),
    message: 'Here is your content calendar. Please check the visuals, captions and proposed dates. You can approve each post or leave a note wherever you would like a change.',
    access: 'review', expiresAt: null, activity: [] };
}
export function canReview(post) { return post.status === 'pending' || post.status === 'revised'; }
export function reviewDecision(state, ids, decision, note = '') {
  if (!['approved', 'changes'].includes(decision) || (decision === 'changes' && !note.trim())) return state;
  const targets = new Set(ids);
  const eligible = state.posts.filter(p => targets.has(p.id) && state.sharedIds.includes(p.id) && canReview(p));
  if (!eligible.length || state.access === 'view' || (state.expiresAt && state.expiresAt <= Date.now())) return state;
  const validIds = new Set(eligible.map(p => p.id));
  return { ...state, posts: state.posts.map(p => validIds.has(p.id) ? { ...p, status: decision,
    notes: [...p.notes, { author: 'Client', text: note.trim() || 'Approved this version.', kind: decision }] } : p),
    activity: [{ text: `${eligible.length} post${eligible.length === 1 ? '' : 's'} ${decision === 'approved' ? 'approved' : 'returned with feedback'}`, at: Date.now() }, ...state.activity].slice(0, 20) };
}
export function revisePost(state, id, caption) {
  if (!caption.trim()) return state;
  return { ...state, posts: state.posts.map(p => p.id === id && p.status === 'changes' ? { ...p, caption: caption.trim(), status: 'revised', version: p.version + 1,
    notes: [...p.notes, { author: 'Agency', text: 'Caption updated. Ready for another review.', kind: 'revised' }] } : p) };
}
export function createReviewRound(state, ids, message, access, days) {
  const ready = state.posts.filter(p => ids.includes(p.id) && p.status !== 'draft');
  if (!ready.length) return state;
  return { ...state, sharedIds: ready.map(p => p.id), message, access: access === 'view' ? 'view' : 'review',
    expiresAt: Date.now() + Math.max(1, Number(days) || 7) * 86400000,
    activity: [{ text: `Review preview prepared with ${ready.length} posts`, at: Date.now() }, ...state.activity].slice(0, 20) };
}
