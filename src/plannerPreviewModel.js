import { CALENDAR_PREVIEW_KEY, CALENDAR_NETWORKS, calendarDays, monthKey, seedCalendar } from './calendarPreviewModel';

export const PLANNER_STAGES = { all: 'All content', draft: 'Drafts', ready: 'Ready for review', review: 'With client', changes: 'Changes', approved: 'Approved' };
export const PLANNER_FORMATS = { ig: ['Post', 'Carousel', 'Reel', 'Story'], fb: ['Post', 'Carousel', 'Reel', 'Story'], li: ['Post', 'Carousel'], tt: ['Reel'] };
export const PLANNER_ARTWORK = { sunset: 'Golden hour', table: 'The lunch table', menu: 'Made for sharing', kitchen: 'Behind the scenes', sea: 'By the water' };
export const plannerStorageKey = date => `${CALENDAR_PREVIEW_KEY}:preview-marina:${monthKey(date)}`;
export function plannerStage(post, state) {
  if (post.status === 'draft' || post.status === 'changes' || post.status === 'approved') return post.status;
  return state.sharedIds.includes(post.id) ? 'review' : 'ready';
}
export function plannerWeeks(date) {
  const days = calendarDays(date), weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    const local = days.slice(index, index + 7).filter(day => day.getMonth() === date.getMonth());
    weeks.push({ key: String(index / 7), first: local[0].getDate(), last: local.at(-1).getDate() });
  }
  return weeks;
}
export function validPlannerState(data, date) {
  return data?.month === monthKey(date) && Array.isArray(data.posts) && Array.isArray(data.sharedIds) && Array.isArray(data.activity) && data.posts.every(p => p && typeof p.id === 'string' && typeof p.title === 'string' && typeof p.caption === 'string' && Array.isArray(p.notes) && p.notes.every(n=>n && typeof n.text==='string' && typeof n.author==='string') && Number.isInteger(p.version) && p.version > 0 && Object.hasOwn(CALENDAR_NETWORKS, p.platform) && PLANNER_FORMATS[p.platform].includes(p.format) && Object.hasOwn(PLANNER_ARTWORK,p.art) && ['draft','pending','revised','changes','approved'].includes(p.status) && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.time || '') && Number.isInteger(p.day) && p.day > 0 && p.day <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
}
export function readPlannerMonth(date, store) {
  try {
    const raw = (store || window.localStorage).getItem(plannerStorageKey(date));
    if (!raw) return { data: seedCalendar(date), error: '' };
    const data = JSON.parse(raw);
    if (validPlannerState(data, date)) return { data, error: '' };
    return { data: seedCalendar(date), error: 'The saved sample could not be read. Editing is paused to keep it safe.' };
  } catch (_) { return { data: seedCalendar(date), error: 'Browser storage is unavailable. You can browse the sample, but changes cannot be saved.' }; }
}
export function validatePlannerPost(input, month) {
  if (!input.title?.trim()) return 'Add a title so your team can recognize this post.';
  if (input.title.trim().length > 100) return 'Keep the title to 100 characters or fewer.';
  if (!input.caption?.trim()) return 'Add a caption before saving the draft.';
  if (input.caption.trim().length > 2200) return 'Keep this preview caption to 2,200 characters or fewer.';
  if (!Object.hasOwn(PLANNER_FORMATS, input.platform) || !PLANNER_FORMATS[input.platform].includes(input.format)) return 'Choose a format available for this channel.';
  if (!Object.hasOwn(PLANNER_ARTWORK, input.art)) return 'Choose sample artwork for the preview.';
  const [year, m] = month.split('-').map(Number);
  if (!Number.isInteger(Number(input.day)) || Number(input.day) < 1 || Number(input.day) > new Date(year, m, 0).getDate()) return 'Choose a date within the selected month.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time || '')) return 'Choose a valid proposed time.';
  return '';
}
export function savePlannerPost(state, input, id, expectedVersion, expectedStatus) {
  const error = validatePlannerPost(input, state.month);
  if (error) return { ok: false, error };
  const old = id ? state.posts.find(p => p.id === id) : null;
  if (id && (!old || old.version !== expectedVersion || (expectedStatus && old.status !== expectedStatus))) return { ok: false, conflict: true, error: 'This post changed in another view. Close and reopen it to edit the latest version.' };
  const fields = { title: input.title.trim(), caption: input.caption.trim(), day: Number(input.day), time: input.time, platform: input.platform, format: input.format, art: input.art };
  if (old && Object.keys(fields).every(key => fields[key] === old[key])) return { ok: true, data: state, post: old, unchanged: true };
  const post = old ? { ...old, ...fields, version: old.version + 1, status: old.status === 'draft' ? 'draft' : 'revised', notes: old.status === 'draft' ? old.notes : [...old.notes, { author: 'Agency', text: 'Content or proposed date updated in Planner. Please review this new version.', kind: 'revised' }] } : {
    ...fields, id: `planner-${state.month}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, status: 'draft', version: 1, notes: [],
  };
  const posts = old ? state.posts.map(p => p.id === id ? post : p) : [...state.posts, post];
  return { ok: true, post, data: { ...state, posts: posts.sort((a,b) => a.day - b.day || a.time.localeCompare(b.time)), activity: [{ text: old ? `${post.title} updated in Planner` : `${post.title} added as a private draft`, at: Date.now() }, ...state.activity].slice(0, 20) } };
}
export function readyPlannerPost(state, id, expectedVersion) {
  const post = state.posts.find(p => p.id === id);
  if (!post || post.version !== expectedVersion || post.status !== 'draft') return { ok: false, conflict: true, error: 'This post changed in another view. Close and reopen it to continue.' };
  const error = validatePlannerPost(post, state.month);
  if (error) return { ok: false, error };
  const ready = { ...post, status: 'pending', version: post.version + 1 };
  return { ok: true, post: ready, data: { ...state, posts: state.posts.map(p => p.id === id ? ready : p), sharedIds: state.sharedIds.filter(sharedId => sharedId !== id), activity: [{ text: `${post.title} marked ready for review`, at: Date.now() }, ...state.activity].slice(0, 20) } };
}
export function commitPlannerChange(date, operation, store) {
  const loaded = readPlannerMonth(date, store);
  if (loaded.error) return { ok: false, error: loaded.error };
  const result = operation(loaded.data);
  if (!result.ok || result.unchanged) return result;
  try { (store || window.localStorage).setItem(plannerStorageKey(date), JSON.stringify(result.data)); return result; }
  catch (_) { return { ok: false, error: 'Not saved. Browser storage is full or unavailable. Your edits are still here.' }; }
}
