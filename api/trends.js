// api/trends.js — Live trending TikTok + Instagram posts via EnsembleData
// Token is read from the ENSEMBLE_TOKEN environment variable (never hardcoded).
// All upstream calls run in parallel with a hard per-call timeout so the
// function always returns quickly (Vercel Hobby kills functions at 10s).
export const maxDuration = 10;

const ROOT = "https://ensembledata.com/apis";

// Region -> one representative hashtag (kept to a single tag to conserve the free 50/day unit budget).
const REGION_TAGS = {
  worldwide: ["fyp"],
  gcc:       ["khaleeji", "dubai"],
  bahrain:   ["bahrain", "manama"],
  saudi:     ["saudi", "riyadh"],
  uae:       ["dubai", "uae"],
  usa:       ["trending", "usa"],
};

// Region -> YouTube regionCode (ISO 3166-1 alpha-2) for the free, always-on trending feed.
const REGION_YT = {
  worldwide: "US",
  gcc:       "AE",
  bahrain:   "BH",
  saudi:     "SA",
  uae:       "AE",
  usa:       "US",
};

// GCC + Worldwide blend several countries so the feed is genuinely distinct from any single country.
const YT_BLEND = {
  worldwide: ["US", "GB", "IN", "BR"],
  gcc:       ["AE", "SA", "BH", "KW", "QA", "OM"],
};

function mapYoutube(data, region) {
  const out = [];
  for (const v of (data?.items || [])) {
    const sn = v.snippet || {}; const st = v.statistics || {};
    const thumb = (sn.thumbnails && (sn.thumbnails.high || sn.thumbnails.medium || sn.thumbnails.default) || {}).url || null;
    if (!v.id) continue;
    out.push({
      platform: "youtube",
      id: String(v.id),
      caption: sn.title || "",
      author: sn.channelTitle || "",
      thumbnail: thumb,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      views: parseInt(st.viewCount || "0", 10) || 0,
      likes: parseInt(st.likeCount || "0", 10) || 0,
      hashtag: region,
    });
  }
  return out;
}

async function getJson(url, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

function mapTiktok(data, tag) {
  const out = [];
  const posts = data?.data?.data || data?.data?.aweme_list || data?.data?.posts || data?.posts || (Array.isArray(data?.data) ? data.data : []) || [];
  for (const p of posts) {
    const a = p.aweme_info || p;
    const stats = a.statistics || a;
    const author = a.author || {};
    const cover = a.video?.cover?.url_list?.[0] || a.video?.origin_cover?.url_list?.[0] || a.cover?.url_list?.[0] || (typeof a.cover === "string" ? a.cover : null);
    const uid = author.unique_id || author.uniqueId || "";
    const id = a.aweme_id || a.id;
    if (!id) continue;
    out.push({
      platform: "tiktok",
      id: String(id),
      caption: a.desc || "",
      author: uid ? "@" + uid : (author.nickname || ""),
      thumbnail: typeof cover === "string" ? cover : null,
      url: uid && id ? `https://www.tiktok.com/@${uid}/video/${id}` : (a.share_url || ""),
      views: stats.play_count || 0,
      likes: stats.digg_count || 0,
      hashtag: tag,
    });
  }
  return out;
}

function mapInstagram(data, tag) {
  const out = [];
  const posts = data?.data?.top_posts || data?.data?.posts || data?.data?.items || data?.posts || (Array.isArray(data?.data) ? data.data : []) || [];
  for (const p of posts) {
    const n = p.node || p;
    const code = n.shortcode || n.code;
    const cover = n.thumbnail_src || n.display_url || n.image_versions?.items?.[0]?.url || (typeof n.thumbnail === "string" ? n.thumbnail : null);
    const caption = n.caption?.text || n.edge_media_to_caption?.edges?.[0]?.node?.text || (typeof n.caption === "string" ? n.caption : "");
    const likes = n.like_count || n.edge_liked_by?.count || n.edge_media_preview_like?.count || 0;
    const uname = n.owner?.username || n.user?.username || "";
    const fullName = n.owner?.full_name || n.user?.full_name || "";
    out.push({
      platform: "instagram",
      id: String(n.id || code || Math.random()),
      caption,
      author: uname ? "@" + uname : (fullName || ""),
      thumbnail: typeof cover === "string" ? cover : null,
      url: code ? `https://www.instagram.com/p/${code}/` : "",
      views: n.video_view_count || n.view_count || 0,
      likes,
      hashtag: tag,
    });
  }
  return out;
}

// Apify dataset mappers — read whatever the TikTok / Instagram scraper Actors output (schemas vary by Actor,
// so we accept several common field names defensively).
function mapApifyTiktok(items) {
  const arr = Array.isArray(items) ? items : (items && items.items) || [];
  return arr.map(p => ({
    platform: "tiktok",
    id: String(p.id || p.webVideoUrl || Math.random()),
    caption: p.text || p.desc || "",
    author: (p.authorMeta && p.authorMeta.name) ? "@" + p.authorMeta.name : (p.authorName ? "@" + p.authorName : ""),
    thumbnail: (p.videoMeta && p.videoMeta.coverUrl) || (Array.isArray(p.covers) ? p.covers[0] : null) || p.coverUrl || p.thumbnail || null,
    url: p.webVideoUrl || p.url || "",
    views: p.playCount || p.views || 0,
    likes: p.diggCount || p.likes || 0,
    hashtag: "apify",
  })).filter(i => i.thumbnail);
}

function mapApifyInstagram(items) {
  const arr = Array.isArray(items) ? items : (items && items.items) || [];
  return arr.map(p => ({
    platform: "instagram",
    id: String(p.id || p.shortCode || p.url || Math.random()),
    caption: typeof p.caption === "string" ? p.caption : (p.caption && p.caption.text) || "",
    author: p.ownerUsername ? "@" + p.ownerUsername : (p.ownerFullName || ""),
    thumbnail: p.displayUrl || p.thumbnailUrl || p.imageUrl || null,
    url: p.url || (p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : ""),
    views: p.videoViewCount || p.viewsCount || 0,
    likes: p.likesCount || p.likeCount || 0,
    hashtag: "apify",
  })).filter(i => i.thumbnail);
}

// ── Streams (live social listening) helpers ──────────────────────────────
function streamTimeAgo(ts) {
  if (!ts) return "";
  let d;
  if (typeof ts === "number") d = new Date(ts < 1e12 ? ts * 1000 : ts);
  else d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  const mins = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return mins + "m";
  const h = Math.round(mins / 60);
  if (h < 24) return h + "h";
  return Math.round(h / 24) + "d";
}
const STREAM_POS = ["love","loved","great","amazing","best","awesome","excellent","perfect","good","nice","impressed","favorite","favourite","recommend","clean","solid","beautiful","wonderful","happy","fantastic","brilliant","quality","worth","stunning","gem","obsessed","incredible","smooth","helpful","fast","friendly","delicious","wow"];
const STREAM_NEG = ["bad","worst","terrible","awful","poor","slow","disappointed","disappointing","hate","ugly","scam","rude","broken","late","problem","issue","avoid","waste","overpriced","horrible","cancel","refund","wrong","never again","ripoff","disgusting","fail","worse"];
function streamSentiment(text) {
  const t = " " + String(text || "").toLowerCase().replace(/[^\p{L}\s#@]/gu, " ") + " ";
  let s = 0;
  for (const w of STREAM_POS) if (t.includes(" " + w + " ")) s++;
  for (const w of STREAM_NEG) if (t.includes(" " + w + " ")) s--;
  const ar = String(text || "");
  if (/(رائع|ممتاز|أفضل|جميل|أحب|تحفة|نظيف|راقي|روعة|حلو|مذهل)/.test(ar)) s++;
  if (/(سيء|سيئ|أسوأ|بطيء|مشكلة|خداع|وقح|مخيب|فاشل|زفت)/.test(ar)) s--;
  return s > 0 ? "pos" : s < 0 ? "neg" : "neu";
}
function mapStreamPost(p, plat) {
  if (!p) return null;
  if (plat === "tt") {
    const author = (p.authorMeta && (p.authorMeta.name || p.authorMeta.nickName || p.authorMeta.uniqueId)) || p.authorName || p.author || p.uniqueId || "";
    const text = p.text || p.desc || p.caption || "";
    if (!author && !text) return null;
    return { author: String(author).replace(/^@/, ""), platform: "tt", text,
      time: streamTimeAgo(p.createTimeISO || p.createTime || p.createTimeISO),
      likes: p.diggCount || p.likesCount || (p.stats && p.stats.diggCount) || 0,
      comments: p.commentCount || p.comments || (p.stats && p.stats.commentCount) || 0,
      url: p.webVideoUrl || p.url || "", sentiment: streamSentiment(text) };
  }
  const author = p.ownerUsername || p.username || (p.owner && p.owner.username) || p.ownerFullName || "";
  const text = (typeof p.caption === "string" ? p.caption : (p.caption && p.caption.text)) || p.text || "";
  if (!author && !text) return null;
  return { author: String(author).replace(/^@/, ""), platform: "ig", text,
    time: streamTimeAgo(p.timestamp || p.takenAtTimestamp),
    likes: p.likesCount || p.likeCount || 0,
    comments: p.commentsCount || p.commentCount || 0,
    url: p.url || (p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : ""),
    sentiment: streamSentiment(text) };
}

// ── Prospect Audit (Pitch in a Click) — scrape one public profile + recent
// posts and return rich metrics for the audit/proposal generator. ──
async function twScrapeProfile(handle, plat, APIFY_TOKEN, limit) {
  if (!APIFY_TOKEN || !handle) return null;
  try {
    const isTT = plat === "tiktok" || plat === "tt";
    const actor = isTT ? (process.env.APIFY_TT_PROFILE_ACTOR || "clockworks~tiktok-profile-scraper")
                       : (process.env.APIFY_IG_PROFILE_ACTOR || "apify~instagram-profile-scraper");
    const input = isTT ? { profiles: [handle], resultsPerPage: limit || 12, shouldDownloadVideos: false, shouldDownloadCovers: false }
                       : { usernames: [handle], resultsLimit: limit || 12 };
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    const items = await r.json();
    const arr = Array.isArray(items) ? items : (items && items.items) || [];
    const prof = arr.find(x => x && (x.followersCount != null || x.followers != null || x.fans != null)) || arr[0] || {};
    const followers = prof.followersCount || prof.followers || prof.fans || (prof.stats && prof.stats.followerCount) || null;
    const postCount = prof.postsCount || prof.mediaCount || (prof.stats && prof.stats.videoCount) || null;
    const posts = (Array.isArray(prof.latestPosts) && prof.latestPosts.length) ? prof.latestPosts
      : arr.filter(x => x && (x.likesCount != null || x.diggCount != null || x.statistics));
    const sample = posts.slice(0, 12);
    let likes = 0, comments = 0, n = 0, videoN = 0; const tagCount = {}; const stamps = []; const scored = [];
    for (const p of sample) {
      const lk = p.likesCount || p.diggCount || (p.statistics && (p.statistics.diggCount || p.statistics.digg_count)) || 0;
      const cm = p.commentsCount || p.commentCount || (p.statistics && p.statistics.comment_count) || 0;
      likes += lk; comments += cm; n++;
      const type = String(p.type || p.productType || p.mediaType || "").toLowerCase();
      if (type.includes("video") || type.includes("reel") || type.includes("clip") || p.videoUrl || p.videoDuration || p.isVideo) videoN++;
      const cap = p.caption || p.text || "";
      (String(cap).match(/#[\p{L}0-9_]+/gu) || []).forEach(tag => { tagCount[tag] = (tagCount[tag] || 0) + 1; });
      (Array.isArray(p.hashtags) ? p.hashtags : []).forEach(h => { const raw = (typeof h === "string" ? h : (h && h.name) || ""); if (raw) { const k = raw[0] === "#" ? raw : "#" + raw; tagCount[k] = (tagCount[k] || 0) + 1; } });
      const ts = p.timestamp || p.createTimeISO || p.takenAt || p.createTime || null; if (ts) { const ms = new Date(ts).getTime(); if (ms) stamps.push(ms); }
      scored.push({ eng: lk + cm, likes: lk, comments: cm, url: p.url || (p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : ""), caption: String(cap).slice(0, 90) });
    }
    const avgEng = n ? Math.round((likes + comments) / n) : null;
    const engRate = (followers && avgEng) ? +(avgEng / followers * 100).toFixed(2) : null;
    const videoShare = n ? Math.round(videoN / n * 100) : null;
    let postsPerWeek = null;
    if (stamps.length >= 2) { const span = (Math.max(...stamps) - Math.min(...stamps)) / 86400000; if (span > 0) postsPerWeek = +(((stamps.length - 1) / (span / 7))).toFixed(1); }
    scored.sort((a, b) => b.eng - a.eng);
    const topHashtags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
    if (!(followers || postCount || n)) return null;
    return { followers, postCount, avgEng, engRate, videoShare, postsPerWeek, sampleSize: n, topHashtags, bestPost: scored[0] || null, worstPost: scored[scored.length - 1] || null, name: prof.fullName || prof.name || prof.nickName || handle, avatar: prof.profilePicUrl || prof.avatar || null };
  } catch (e) { return null; }
}

function twDemoAudit(handle, benchmark, deep) {
  const m = { followers: 8420, postCount: 214, postsPerWeek: 2.1, engRate: 1.8, benchmark: benchmark || 3.4, sampleSize: 12, videoShare: 0, target: 4.5 };
  const findings = [
    "Posts about 2 times a week, below the 4 to 5 that build momentum.",
    "None of the recent posts are video, where most new reach now lives.",
    "Engagement sits at 1.8%, under the roughly 3.4% typical for similar cafes.",
  ];
  const fixes = [
    { title: "Show up on video", body: "Ship 4 short Reels a week, the fastest lever for fresh reach beyond current followers." },
    { title: "Post more, on a rhythm", body: "Move to 4 or 5 posts a week on a set schedule so the algorithm learns to push you." },
    { title: "Talk back, fast", body: "Reply to every comment and DM within the hour to turn watchers into regulars." },
  ];
  const roadmap = [
    { phase: "Weeks 1 to 2 · Foundation", items: ["Lock a weekly content calendar", "Refresh bio, highlights and pinned posts", "Set the brand voice and look"] },
    { phase: "Weeks 3 to 6 · Momentum", items: ["4 Reels a week", "Daily Stories", "Reply within the hour, every day"] },
    { phase: "Weeks 7 to 12 · Growth", items: ["Double down on the top formats", "Weekly customer reposts and light collabs", "Monthly report and tune"] },
  ];
  const out = { name: "Cafe Bahrain", avatar: null, metrics: m, findings, fixes, roadmap, topHashtags: ["#bahrainfood", "#manama", "#coffee"], bestPost: { likes: 540, comments: 31, caption: "Weekend brunch is back" }, worstPost: { likes: 38, comments: 1, caption: "We are open today" }, competitors: [], summary: "Cafe Bahrain has a real audience of 8,420 but is posting too little and barely using video. Closing those two gaps alone should lift engagement toward the benchmark within 90 days." };
  if (deep) out.competitors = [ { handle: "rival_cafe", followers: 14200, engRate: 3.9, postsPerWeek: 5.2 }, { handle: "corner_roastery", followers: 9800, engRate: 4.4, postsPerWeek: 6.0 } ];
  return out;
}

export default async function handler(req, res) {
  const token = process.env.ENSEMBLE_TOKEN;
  const YT_KEY = process.env.YOUTUBE_API_KEY;
  const APIFY_TOKEN = process.env.APIFY_TOKEN;

  // ── Prospect Audit (Pitch in a Click): handle in, full audit out. ──
  if (req.query && req.query.mode === "audit") {
    const handle = String(req.query.handle || "").replace(/^@/, "").trim();
    const plat = String(req.query.platform || "instagram").toLowerCase();
    const deep = req.query.deep === "1" || req.query.deep === "true";
    if (!handle) return res.status(200).json({ ok: false, message: "No handle" });
    const competitorsQ = String(req.query.competitors || "").split(",").map(s => s.replace(/^@/, "").trim()).filter(Boolean).slice(0, 2);

    const me = await twScrapeProfile(handle, plat, APIFY_TOKEN, 12);
    let benchmark = 3.4; const competitors = [];
    if (deep && competitorsQ.length) {
      for (const c of competitorsQ) { const cp = await twScrapeProfile(c, plat, APIFY_TOKEN, 8); if (cp) competitors.push({ handle: c, followers: cp.followers, engRate: cp.engRate, postsPerWeek: cp.postsPerWeek }); }
      const rates = competitors.map(c => c.engRate).filter(x => x != null); if (rates.length) benchmark = +((rates.reduce((a, b) => a + b, 0) / rates.length)).toFixed(1);
    }

    if (!me) return res.status(200).json({ ok: true, demo: true, handle, platform: plat, deep, ...twDemoAudit(handle, benchmark, deep) });

    const findings = []; const fixes = [];
    const er = me.engRate, ppw = me.postsPerWeek, vs = me.videoShare;
    if (ppw != null && ppw < 3) { findings.push(`Posts about ${ppw} times a week, below the 4 to 5 that build momentum.`); fixes.push({ title: "Post more, on a rhythm", body: "Move to 4 or 5 posts a week on a set schedule so the algorithm learns to push you." }); }
    if (vs != null && vs < 30) { findings.push(`Only ${vs}% of recent posts are video, where most new reach now lives.`); fixes.push({ title: "Show up on video", body: "Ship 4 short Reels a week, the fastest lever for fresh reach beyond current followers." }); }
    if (er != null && er < benchmark) { findings.push(`Engagement sits at ${er}%, under the roughly ${benchmark}% typical for similar accounts.`); fixes.push({ title: "Lift engagement", body: "Strong hooks in the first line, a clear reason to comment, and replies within the hour." }); }
    if ((me.topHashtags || []).length < 3) { findings.push("Few hashtags in use, so discovery is being left on the table."); fixes.push({ title: "Smart hashtags", body: "A tight set of 8 to 12 niche and local tags per post to widen discovery." }); }
    const fallbackFixes = [ { title: "Daily Stories", body: "A simple daily Story keeps you top of mind between posts." }, { title: "Talk back, fast", body: "Reply to every comment and DM within the hour to build loyalty." }, { title: "Weekly customer repost", body: "Reshare a real customer post each week for free, trusted content." } ];
    while (fixes.length < 3 && fallbackFixes.length) { const f = fallbackFixes.shift(); if (!fixes.find(x => x.title === f.title)) fixes.push(f); }
    if (!findings.length) findings.push("Solid base. The gap is consistency and video, and both are quick wins.");

    const roadmap = [
      { phase: "Weeks 1 to 2 · Foundation", items: ["Lock a weekly content calendar", "Refresh bio, highlights and pinned posts", "Set the brand voice and look"] },
      { phase: "Weeks 3 to 6 · Momentum", items: ["4 Reels a week", "Daily Stories", "Reply within the hour, every day"] },
      { phase: "Weeks 7 to 12 · Growth", items: ["Double down on the top formats", "Weekly customer reposts and light collabs", "Monthly report and tune"] },
    ];
    const target = +(Math.max((benchmark || 3.4) + 1, (er || benchmark || 3.4) + 2)).toFixed(1);
    let summary = `${me.name || handle} has a real audience of ${me.followers ? me.followers.toLocaleString() : "a loyal following"} but is posting too little and barely using video. Closing those two gaps alone should lift engagement toward the ${benchmark}% benchmark within 90 days.`;
    if (deep && process.env.ANTHROPIC_API_KEY) {
      try {
        const sys = "You are a sharp social media strategist. Write a concise, confident 3 sentence executive summary for a sales proposal, based only on the JSON metrics provided. No hype, no emojis, and do not use hyphens or dashes.";
        const cr = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 260, system: sys, messages: [{ role: 'user', content: JSON.stringify({ name: me.name, handle, followers: me.followers, engagementRate: er, benchmark, postsPerWeek: ppw, videoSharePct: vs, topHashtags: me.topHashtags }) }] }) });
        const j = await cr.json(); const txt = j && j.content && j.content[0] && j.content[0].text; if (txt) summary = txt.trim();
      } catch (e) { /* keep templated summary */ }
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json({ ok: true, handle, platform: plat, deep, name: me.name, avatar: me.avatar,
      metrics: { followers: me.followers, postCount: me.postCount, postsPerWeek: ppw, engRate: er, benchmark, sampleSize: me.sampleSize, videoShare: vs, target },
      findings, fixes: fixes.slice(0, deep ? 5 : 3), roadmap, topHashtags: me.topHashtags, bestPost: me.bestPost, worstPost: me.worstPost, competitors, summary });
  }

  const APIFY_TT_ACTOR = process.env.APIFY_TT_ACTOR; // e.g. clockworks~tiktok-scraper
  const APIFY_IG_ACTOR = process.env.APIFY_IG_ACTOR; // e.g. apify~instagram-hashtag-scraper
  if (!token && !YT_KEY && !APIFY_TOKEN) {
    return res.status(200).json({ connected: false, items: [], message: "No trends source configured. Add YOUTUBE_API_KEY (free) and/or APIFY_TOKEN / ENSEMBLE_TOKEN in Vercel env vars." });
  }

  // Competitor profile lookup (best-effort) — powers the Competitor Spy feature.
  // Returns whatever public stats EnsembleData can give; empty if the handle/quota fails.
  if (req.query && req.query.mode === "competitor") {
    const handle = String(req.query.handle || "").replace(/^@/, "").trim();
    const plat = String(req.query.platform || "instagram").toLowerCase();
    if (!handle) return res.status(200).json({ ok: false });

    // Live profile stats via Apify profile scrapers (run-sync, one handle). Falls back to EnsembleData below.
    if (APIFY_TOKEN) {
      try {
        const isTTa = plat === "tiktok" || plat === "tt";
        const actor = isTTa ? (process.env.APIFY_TT_PROFILE_ACTOR || "clockworks~tiktok-profile-scraper")
                            : (process.env.APIFY_IG_PROFILE_ACTOR || "apify~instagram-profile-scraper");
        const input = isTTa
          ? { profiles: [handle], resultsPerPage: 12, shouldDownloadVideos: false, shouldDownloadCovers: false }
          : { usernames: [handle], resultsLimit: 12 };
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 9000);
        const r = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: ctrl.signal,
        }).finally(() => clearTimeout(t));
        const items = await r.json();
        const arr = Array.isArray(items) ? items : (items && items.items) || [];
        const prof = arr.find(x => x && (x.followersCount != null || x.followers != null || x.fans != null)) || arr[0] || {};
        const followers = prof.followersCount || prof.followers || prof.fans || (prof.stats && prof.stats.followerCount) || null;
        const postCount = prof.postsCount || prof.mediaCount || (prof.stats && prof.stats.videoCount) || null;
        const posts = (Array.isArray(prof.latestPosts) && prof.latestPosts.length) ? prof.latestPosts
          : arr.filter(x => x && (x.likesCount != null || x.diggCount != null || x.statistics));
        let likes = 0, comments = 0, n = 0; const tagCount = {};
        for (const p of posts.slice(0, 12)) {
          likes += p.likesCount || p.diggCount || (p.statistics && (p.statistics.diggCount || p.statistics.digg_count)) || 0;
          comments += p.commentsCount || p.commentCount || (p.statistics && p.statistics.comment_count) || 0; n++;
          const cap = p.caption || p.text || "";
          (String(cap).match(/#[\p{L}0-9_]+/gu) || []).forEach(tag => { tagCount[tag] = (tagCount[tag] || 0) + 1; });
          (Array.isArray(p.hashtags) ? p.hashtags : []).forEach(h => { const raw = (typeof h === "string" ? h : (h && h.name) || ""); if (raw) { const k = raw[0] === "#" ? raw : "#" + raw; tagCount[k] = (tagCount[k] || 0) + 1; } });
        }
        const topHashtags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
        const avgEngagement = n ? Math.round((likes + comments) / n) : null;
        if (followers || postCount || n) {
          res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");
          return res.status(200).json({ ok: true, handle, platform: plat, followers, postCount, avgEngagement, sampleSize: n, topHashtags });
        }
      } catch (e) { /* fall through to EnsembleData / not-found */ }
    }

    if (!token) return res.status(200).json({ ok: false });
    try {
      const isTT = plat === "tiktok" || plat === "tt";
      const infoUrl = isTT
        ? `${ROOT}/tt/user/info?username=${encodeURIComponent(handle)}&token=${token}`
        : `${ROOT}/instagram/user/info?username=${encodeURIComponent(handle)}&token=${token}`;
      const postsUrl = isTT
        ? `${ROOT}/tt/user/posts?username=${encodeURIComponent(handle)}&depth=1&token=${token}`
        : `${ROOT}/instagram/user/posts?username=${encodeURIComponent(handle)}&depth=1&chunk_size=10&token=${token}`;
      const [info, postsD] = await Promise.all([getJson(infoUrl).catch(() => null), getJson(postsUrl).catch(() => null)]);
      const u = (info && (info.data || info)) || {};
      const followers = u.follower_count || u.followers || (u.edge_followed_by && u.edge_followed_by.count) || (u.stats && u.stats.followerCount) || null;
      const postCount = u.media_count || u.aweme_count || (u.stats && u.stats.videoCount) || null;
      const raw = (postsD && (postsD.data?.posts || postsD.data?.items || postsD.data || postsD.posts)) || [];
      const arr = Array.isArray(raw) ? raw : [];
      let likes = 0, comments = 0, n = 0; const tagCount = {};
      for (const p of arr.slice(0, 12)) {
        const a = p.node || p.aweme_info || p;
        likes += a.like_count || (a.statistics && a.statistics.digg_count) || (a.edge_liked_by && a.edge_liked_by.count) || 0;
        comments += a.comment_count || (a.statistics && a.statistics.comment_count) || 0; n++;
        const cap = (a.caption && a.caption.text) || a.desc || (a.edge_media_to_caption && a.edge_media_to_caption.edges?.[0]?.node?.text) || "";
        (String(cap).match(/#[\p{L}0-9_]+/gu) || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
      }
      const topHashtags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
      const avgEngagement = n ? Math.round((likes + comments) / n) : null;
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");
      return res.status(200).json({ ok: !!(followers || postCount || n), handle, platform: plat, followers, postCount, avgEngagement, sampleSize: n, topHashtags });
    } catch (e) {
      return res.status(200).json({ ok: false, error: e.message });
    }
  }

  // ── Streams: live social listening for one keyword / #hashtag / @mention ──
  // One column = one request = one Apify run-sync (≤9s, stays under the 10s cap).
  if (req.query && req.query.mode === "streams") {
    const q = String(req.query.q || "").trim();
    const kind = String(req.query.kind || "").toLowerCase();
    const plat = String(req.query.platform || "ig").toLowerCase();
    const isTT = plat === "tiktok" || plat === "tt";
    if (!q) return res.status(200).json({ ok: false, items: [] });
    if (!APIFY_TOKEN) return res.status(200).json({ ok: false, items: [], message: "Streams need APIFY_TOKEN set in Vercel." });
    const term = q.replace(/^[#@]/, "").trim();
    try {
      const actor = isTT
        ? (process.env.APIFY_TT_SEARCH_ACTOR || process.env.APIFY_TT_ACTOR || "clockworks~tiktok-scraper")
        : (process.env.APIFY_IG_SEARCH_ACTOR || process.env.APIFY_IG_ACTOR || "apify~instagram-hashtag-scraper");
      const input = isTT
        ? { searchQueries: [term], resultsPerPage: 14, shouldDownloadVideos: false, shouldDownloadCovers: false, proxyConfiguration: { useApifyProxy: true } }
        : { hashtags: [term], resultsLimit: 16, resultsType: "posts" };
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 9000);
      const r = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: ctrl.signal,
      }).finally(() => clearTimeout(t));
      const rawData = await r.json();
      const arr = Array.isArray(rawData) ? rawData : (rawData && rawData.items) || [];
      const items = arr.map(p => mapStreamPost(p, isTT ? "tt" : "ig")).filter(Boolean).slice(0, 14);
      let pos = 0, neu = 0, neg = 0;
      for (const it of items) { if (it.sentiment === "pos") pos++; else if (it.sentiment === "neg") neg++; else neu++; }
      res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
      return res.status(200).json({ ok: items.length > 0, q, kind, platform: isTT ? "tt" : "ig", count: items.length, sentiment: { pos, neu, neg }, items });
    } catch (e) {
      return res.status(200).json({ ok: false, items: [], error: e.name === "AbortError" ? "timeout" : e.message });
    }
  }

  const region = String((req.query && req.query.region) || "worldwide").toLowerCase();
  const platform = String((req.query && req.query.platform) || "all").toLowerCase();
  const tags = REGION_TAGS[region] || REGION_TAGS.worldwide;

  // Build all upstream calls up front, then run them in parallel.
  const jobs = [];
  // Free, always-on: YouTube trending (mostPopular) via the YouTube Data API key (10k/day quota).
  // GCC + Worldwide pull several countries and merge, so they're genuinely different from any single one.
  if (YT_KEY && (platform === "all" || platform === "youtube")) {
    const codes = YT_BLEND[region] || [REGION_YT[region] || "US"];
    const per = codes.length > 1 ? 12 : 24;
    for (const rc of codes) {
      jobs.push(getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${rc}&maxResults=${per}&key=${YT_KEY}`)
        .then(d => mapYoutube(d, region)).catch(() => []));
    }
  }
  // TikTok + Instagram: prefer Apify (its scheduler scrapes daily; we just read the last successful run's
  // dataset — one fast call, no timeout). Fall back to EnsembleData only for a platform Apify isn't set for.
  const apifyTT = APIFY_TOKEN && APIFY_TT_ACTOR;
  const apifyIG = APIFY_TOKEN && APIFY_IG_ACTOR;
  if (apifyTT && (platform === "all" || platform === "tiktok")) {
    jobs.push(getJson(`https://api.apify.com/v2/acts/${APIFY_TT_ACTOR}/runs/last/dataset/items?token=${APIFY_TOKEN}&status=SUCCEEDED&clean=true&limit=24`)
      .then(d => mapApifyTiktok(d)).catch(() => []));
  }
  if (apifyIG && (platform === "all" || platform === "instagram")) {
    jobs.push(getJson(`https://api.apify.com/v2/acts/${APIFY_IG_ACTOR}/runs/last/dataset/items?token=${APIFY_TOKEN}&status=SUCCEEDED&clean=true&limit=24`)
      .then(d => mapApifyInstagram(d)).catch(() => []));
  }
  if (token) {
    for (const tag of tags) {
      if (!apifyTT && (platform === "all" || platform === "tiktok")) {
        jobs.push(getJson(`${ROOT}/tt/hashtag/posts?name=${encodeURIComponent(tag)}&cursor=0&token=${token}`)
          .then(d => mapTiktok(d, tag)).catch(() => []));
      }
      if (!apifyIG && (platform === "all" || platform === "instagram")) {
        jobs.push(getJson(`${ROOT}/instagram/hashtag/posts?name=${encodeURIComponent(tag)}&cursor=&get_author_info=false&token=${token}`)
          .then(d => mapInstagram(d, tag)).catch(() => []));
      }
    }
  }

  try {
    const results = await Promise.all(jobs);
    let items = results.flat().filter(i => i && i.thumbnail);
    const seen = new Set();
    items = items.filter(i => (seen.has(i.id) ? false : (seen.add(i.id), true)));
    items.sort((a, b) => (b.views + b.likes) - (a.views + a.likes));
    items = items.slice(0, 24);
    if (items.length > 0) {
      // Good data: fresh for 24h (one upstream call per region per day against the free
      // quota), then serve the last good set for at most 1 more day while it revalidates.
      // After that it goes empty (honest "taking a break" state) rather than showing stale.
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");
    } else {
      // Empty (e.g. daily quota hit): retry sooner so it recovers quickly after reset.
      res.setHeader("Cache-Control", "s-maxage=600");
    }
    return res.status(200).json({ connected: true, region, platform, items, updatedAt: Date.now() });
  } catch (e) {
    res.setHeader("Cache-Control", "s-maxage=600");
    return res.status(200).json({ connected: true, items: [], error: e.message });
  }
}
