import { monthKey } from './calendarPreviewModel';

// Draft briefs only. No live campaigns, social accounts, ads, or client records.
export const campaignStorageKey = () => 'tw_campaign_briefs_design_v1:preview-marina';
export const CAMPAIGN_SAMPLE_MONTH = '2026-08';
export function seedCampaignBriefs() {
  const month = CAMPAIGN_SAMPLE_MONTH;
  const postIds = indexes => indexes.map(index => `sample-${month}-${index}`);
  return [
    { id:`sharing-${month}`, name:'Made for sharing', goal:'Bring the lunch menu and sharing dishes together, giving guests a reason to book a table with friends.', start:`${month}-04`, end:`${month}-18`, postIds:postIds([2,3,5,8]), sample:true },
    { id:`sunset-${month}`, name:'Golden hour', goal:'Make Marina the first choice for an evening by the water, from a quiet midweek table to the weekend terrace.', start:`${month}-02`, end:`${month}-23`, postIds:postIds([1,6,10]), sample:true },
    { id:`chapter-${month}`, name:'A fresh chapter', goal:'Introduce the people, flavours, and gathering spaces behind the next season at Marina Social Club.', start:`${month}-08`, end:`${month}-28`, postIds:postIds([4,7,9,11,12]), sample:true },
  ];
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year,month,day] = value.split('-').map(Number);
  const date = new Date(year,month-1,day);
  return year >= 2000 && year <= 2100 && date.getFullYear() === year && date.getMonth() === month-1 && date.getDate() === day;
}
export function validateCampaignBrief(input) {
  const errors = {};
  if (!input.name?.trim()) errors.name = 'Give the campaign a name.';
  else if (input.name.trim().length > 80) errors.name = 'Use 80 characters or fewer.';
  if (!input.goal?.trim()) errors.goal = 'Describe what this campaign should achieve.';
  else if (input.goal.trim().length > 400) errors.goal = 'Keep the goal to 400 characters or fewer.';
  if (!validDate(input.start)) errors.start = 'Choose a valid start date between 2000 and 2100.';
  if (!validDate(input.end)) errors.end = 'Choose a valid end date between 2000 and 2100.';
  else if (!errors.start && input.end < input.start) errors.end = 'The end date must be on or after the start date.';
  return errors;
}
export function readCampaignBriefs(date, store) {
  const sample = seedCampaignBriefs();
  try {
    const raw = (store || window.localStorage).getItem(campaignStorageKey(date));
    if (!raw) return { campaigns:sample, drafts:[], error:'' };
    const drafts = JSON.parse(raw);
    const valid = Array.isArray(drafts) && drafts.every(c => c && typeof c.id === 'string' && c.id.startsWith('brief-') && typeof c.name === 'string' && typeof c.goal === 'string' && Object.keys(validateCampaignBrief(c)).length === 0 && Array.isArray(c.postIds) && c.postIds.length === 0 && c.sample === false) && new Set(drafts.map(c=>c.id)).size === drafts.length;
    if (!valid) throw new Error('Unreadable briefs');
    return { campaigns:[...drafts,...sample], drafts, error:'' };
  } catch (_) {
    return { campaigns:sample, drafts:[], error:'Saved campaign briefs could not be read. You can browse the sample; saving is paused to protect existing drafts.' };
  }
}
export function saveCampaignBrief(date, input, store) {
  const errors = validateCampaignBrief(input);
  if (Object.keys(errors).length) return { ok:false, errors };
  // Read again immediately before the write to retain additions from other tabs.
  const loaded = readCampaignBriefs(date,store);
  if (loaded.error) return { ok:false, error:loaded.error };
  const campaign = { id:`brief-${Date.now()}-${Math.random().toString(36).slice(2,10)}`, name:input.name.trim(), goal:input.goal.trim(), start:input.start, end:input.end, postIds:[], sample:false };
  try {
    (store || window.localStorage).setItem(campaignStorageKey(date),JSON.stringify([campaign,...loaded.drafts]));
    return { ok:true, campaign, loaded:{ campaigns:[campaign,...loaded.campaigns], drafts:[campaign,...loaded.drafts], error:'' } };
  } catch (_) {
    return { ok:false, error:'Not saved. Browser storage is full or unavailable. Your brief is still here; try saving again.' };
  }
}
export function postsForCampaign(campaign, posts) {
  return posts.filter(post => campaign?.postIds.includes(post.id)).sort((a,b)=>a.day-b.day || a.time.localeCompare(b.time));
}
export function campaignsInMonth(campaigns, date) {
  const month = monthKey(date);
  const last = new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
  return campaigns.filter(campaign => campaign.start <= `${month}-${last}` && campaign.end >= `${month}-01`);
}
export function validCampaignMonth(value) {
  return /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value || '');
}
export function campaignCounts(campaigns, posts) {
  const ids = new Set(campaigns.flatMap(c=>c.postIds));
  return { campaigns:campaigns.length, posts:posts.filter(post=>ids.has(post.id)).length };
}
