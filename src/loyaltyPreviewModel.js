const STORAGE_KEY = 'tawaslo.preview.loyalty.v2';

export const LOYALTY_FILTERS = [
  { id: 'all', label: 'Everyone' },
  { id: 'ready', label: 'Reward ready' },
  { id: 'close', label: 'Nearly there' },
  { id: 'quiet', label: 'Bring back' },
];

const seed = {
  version: 2,
  program: {
    enabled: true,
    businessType: 'food_drink',
    programName: 'Return Club',
    type: 'stamps',
    earnAction: 'visit',
    reward: 'A dessert on us',
    stampGoal: 8,
    pointsPerVisit: 10,
    pointsGoal: 100,
    brandColor: '#245f55',
    accentColor: '#f0b94f',
    cardTheme: 'tide',
    stampIcon: 'star',
    welcome: 'A small thank-you for coming back. Keep collecting progress and your next reward is on the way.',
    expiryDays: 180,
    guestLanguage: 'workspace',
    guestAction: 'Visit Marina Social Club',
    guestActionUrl: 'https://tawaslo.com',
  },
  share: {
    slug: 'marina-social-club-rewards',
  },
  members: [
    { id: 'member-layla', name: 'Layla Al Zayani', phone: '+973 3942 2184', code: 'MAR-LZ84', stamps: 7, points: 70, visits: 11, redeemed: 1, lastVisit: 'Today · 7:00 PM', birthday: '12 Oct', favorite: 'Sunday lunch', note: 'Prefers the terrace', quiet: false },
    { id: 'member-hassan', name: 'Hassan Mahmood', phone: '+973 3601 8426', code: 'MAR-HM26', stamps: 8, points: 110, visits: 18, redeemed: 2, lastVisit: 'Yesterday · 8:15 PM', birthday: '03 Dec', favorite: 'Sea bass', note: 'Usually books for four', quiet: false },
    { id: 'member-dana', name: 'Dana Mahmood', phone: '+973 3990 1162', code: 'MAR-DM62', stamps: 4, points: 40, visits: 7, redeemed: 0, lastVisit: '24 Aug · 1:30 PM', birthday: '19 Mar', favorite: 'Long lunch', note: 'No shellfish', quiet: false },
    { id: 'member-mariam', name: 'Mariam Fakhro', phone: '+973 3224 5408', code: 'MAR-MF08', stamps: 2, points: 20, visits: 4, redeemed: 0, lastVisit: '11 Jul · 6:45 PM', birthday: '27 Sep', favorite: 'Garden table', note: 'Birthday coming soon', quiet: true },
    { id: 'member-yousef', name: 'Yousef Kanoo', phone: '+973 3883 7710', code: 'MAR-YK10', stamps: 6, points: 60, visits: 9, redeemed: 1, lastVisit: '28 Aug · 9:00 PM', birthday: '05 May', favorite: 'Weekend dinner', note: 'Often joins the waitlist', quiet: false },
  ],
  activity: [
    { id: 'activity-1', time: '8:42 PM', name: 'Hassan', action: 'Reward unlocked', tone: 'reward' },
    { id: 'activity-2', time: '8:16 PM', name: 'Dana', action: 'Visit recorded', tone: 'visit' },
    { id: 'activity-3', time: '7:04 PM', name: 'Layla', action: 'One visit away', tone: 'close' },
    { id: 'activity-4', time: '1:38 PM', name: 'Noor', action: 'Joined the club', tone: 'join' },
  ],
};

const cloneSeed = () => JSON.parse(JSON.stringify(seed));
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));

function normalizeMember(member, index, program) {
  const safeName = String(member?.name || 'Guest').replace(/\bDana Al Khalifa\b/gi, 'Dana Mahmood');
  return {
    id: member?.id || `member-${index + 1}`,
    name: safeName,
    phone: String(member?.phone || ''),
    code: String(safeName === 'Dana Mahmood' ? 'MAR-DM62' : (member?.code || `MAR-${index + 1}`)).toUpperCase(),
    stamps: clamp(member?.stamps ?? 0, 0, 999),
    points: clamp(member?.points ?? 0, 0, 999999),
    visits: clamp(member?.visits ?? 0, 0, 999999),
    redeemed: clamp(member?.redeemed ?? 0, 0, 999999),
    lastVisit: String(member?.lastVisit || 'Not visited yet'),
    birthday: String(member?.birthday || 'Not added'),
    favorite: String(member?.favorite || 'Still learning'),
    note: String(member?.note || ''),
    quiet: Boolean(member?.quiet),
    ready: program.type === 'points'
      ? Number(member?.points || 0) >= program.pointsGoal
      : Number(member?.stamps || 0) >= program.stampGoal,
  };
}

export function normalizeLoyaltyPreview(value) {
  const fallback = cloneSeed();
  const program = {
    ...fallback.program,
    ...(value?.program || {}),
  };
  program.stampGoal = clamp(program.stampGoal, 2, 20);
  program.pointsGoal = clamp(program.pointsGoal, 10, 10000);
  program.pointsPerVisit = clamp(program.pointsPerVisit, 1, 1000);
  program.expiryDays = clamp(program.expiryDays, 30, 730);
  program.enabled = program.enabled !== false;
  program.programName = String(program.programName || fallback.program.programName).slice(0, 36);
  program.reward = String(program.reward || fallback.program.reward).slice(0, 60);
  program.businessType = ['food_drink', 'fashion', 'retail', 'beauty_wellness', 'services', 'fitness', 'education', 'other'].includes(program.businessType) ? program.businessType : 'other';
  program.earnAction = ['visit', 'purchase', 'order', 'booking'].includes(program.earnAction) ? program.earnAction : 'visit';
  program.stampIcon = ['star', 'heart', 'gift', 'award', 'ticket', 'coffee', 'dining', 'cake', 'shopping', 'gem', 'flower', 'scissors', 'fitness', 'pet', 'book', 'camera', 'music', 'bolt'].includes(program.stampIcon) ? program.stampIcon : 'star';
  program.brandColor = /^#[0-9a-f]{6}$/i.test(program.brandColor) ? program.brandColor.toLowerCase() : fallback.program.brandColor;
  program.accentColor = /^#[0-9a-f]{6}$/i.test(program.accentColor) ? program.accentColor.toLowerCase() : fallback.program.accentColor;
  program.welcome = String(program.welcome || fallback.program.welcome).slice(0, 180);
  if (program.welcome === 'A small thank-you for coming back. Collect eight visits and dessert is ours.') program.welcome = fallback.program.welcome;
  program.guestLanguage = ['workspace', 'en', 'ar'].includes(program.guestLanguage) ? program.guestLanguage : 'workspace';
  program.guestAction = String(program.guestAction || fallback.program.guestAction).slice(0, 48);
  program.guestActionUrl = String(program.guestActionUrl || fallback.program.guestActionUrl).slice(0, 240);
  const members = (Array.isArray(value?.members) ? value.members : fallback.members)
    .map((member, index) => normalizeMember(member, index, program));
  return {
    version: 2,
    program,
    share: { ...fallback.share, ...(value?.share || {}) },
    members,
    activity: Array.isArray(value?.activity) ? value.activity.slice(0, 12) : fallback.activity,
  };
}

export function readLoyaltyPreview() {
  if (typeof window === 'undefined') return normalizeLoyaltyPreview(seed);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return normalizeLoyaltyPreview(stored ? JSON.parse(stored) : seed);
  } catch (_) {
    return normalizeLoyaltyPreview(seed);
  }
}

export function saveLoyaltyPreview(value) {
  const next = normalizeLoyaltyPreview(value);
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
  }
  return next;
}

export function rewardValue(program, member) {
  return program.type === 'points' ? member.points : member.stamps;
}

export function rewardGoal(program) {
  return program.type === 'points' ? program.pointsGoal : program.stampGoal;
}

export function rewardProgress(program, member) {
  return Math.min(100, Math.round((rewardValue(program, member) / rewardGoal(program)) * 100));
}

export function loyaltySummary(value) {
  const data = normalizeLoyaltyPreview(value);
  const ready = data.members.filter(member => rewardValue(data.program, member) >= rewardGoal(data.program)).length;
  const close = data.members.filter(member => {
    const progress = rewardProgress(data.program, member);
    return progress >= 70 && progress < 100;
  }).length;
  const active = data.members.filter(member => !member.quiet).length;
  const redemptions = data.members.reduce((sum, member) => sum + member.redeemed, 0);
  return { members: data.members.length, active, ready, close, redemptions, repeatRate: 63 };
}

export function findLoyaltyMember(value, query) {
  const data = normalizeLoyaltyPreview(value);
  const needle = String(query || '').trim().toLowerCase().replace(/\s/g, '');
  if (!needle) return null;
  return data.members.find(member => [member.name, member.phone, member.code]
    .some(candidate => String(candidate || '').toLowerCase().replace(/\s/g, '').includes(needle))) || null;
}

export function addLoyaltyMember(value, input) {
  const data = normalizeLoyaltyPreview(value);
  const name = String(input?.name || '').trim().slice(0, 80);
  const phone = String(input?.phone || '').trim().slice(0, 32);
  if (!name || !phone) return data;
  const initials = name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'GU';
  const member = {
    id: `member-${Date.now()}`,
    name,
    phone,
    code: `MAR-${initials}${String(Date.now()).slice(-2)}`,
    stamps: 0,
    points: 0,
    visits: 0,
    redeemed: 0,
    lastVisit: 'Just joined',
    birthday: 'Not added',
    favorite: 'Still learning',
    note: 'Joined directly with consent',
    quiet: false,
  };
  return normalizeLoyaltyPreview({ ...data, members: [member, ...data.members] });
}

export function recordLoyaltyVisit(value, memberId) {
  const data = normalizeLoyaltyPreview(value);
  const member = data.members.find(item => item.id === memberId);
  if (!member) return data;
  const members = data.members.map(item => item.id === memberId ? {
    ...item,
    visits: item.visits + 1,
    stamps: data.program.type === 'stamps' ? item.stamps + 1 : item.stamps,
    points: data.program.type === 'points' ? item.points + data.program.pointsPerVisit : item.points,
    lastVisit: 'Just now',
    quiet: false,
  } : item);
  return normalizeLoyaltyPreview({
    ...data,
    members,
    activity: [{ id: `activity-${Date.now()}`, time: 'Now', name: member.name.split(' ')[0], action: 'Visit recorded', tone: 'visit' }, ...data.activity],
  });
}

export function redeemLoyaltyReward(value, memberId) {
  const data = normalizeLoyaltyPreview(value);
  const member = data.members.find(item => item.id === memberId);
  if (!member || rewardValue(data.program, member) < rewardGoal(data.program)) return data;
  const members = data.members.map(item => item.id === memberId ? {
    ...item,
    redeemed: item.redeemed + 1,
    stamps: data.program.type === 'stamps' ? Math.max(0, item.stamps - data.program.stampGoal) : item.stamps,
    points: data.program.type === 'points' ? Math.max(0, item.points - data.program.pointsGoal) : item.points,
  } : item);
  return normalizeLoyaltyPreview({
    ...data,
    members,
    activity: [{ id: `activity-${Date.now()}`, time: 'Now', name: member.name.split(' ')[0], action: 'Reward redeemed', tone: 'reward' }, ...data.activity],
  });
}

export function updateLoyaltyProgram(value, patch) {
  const data = normalizeLoyaltyPreview(value);
  return normalizeLoyaltyPreview({ ...data, program: { ...data.program, ...patch } });
}

export function resetLoyaltyPreview() {
  const next = normalizeLoyaltyPreview(seed);
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }
  return next;
}
