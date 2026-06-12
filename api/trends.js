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

export default async function handler(req, res) {
  const token = process.env.ENSEMBLE_TOKEN;
  if (!token) {
    return res.status(200).json({ connected: false, items: [], message: "ENSEMBLE_TOKEN not set in Vercel env vars." });
  }

  const region = String((req.query && req.query.region) || "worldwide").toLowerCase();
  const platform = String((req.query && req.query.platform) || "all").toLowerCase();
  const tags = REGION_TAGS[region] || REGION_TAGS.worldwide;

  // Build all upstream calls up front, then run them in parallel.
  const jobs = [];
  for (const tag of tags) {
    if (platform === "all" || platform === "tiktok") {
      jobs.push(getJson(`${ROOT}/tt/hashtag/posts?name=${encodeURIComponent(tag)}&cursor=0&token=${token}`)
        .then(d => mapTiktok(d, tag)).catch(() => []));
    }
    if (platform === "all" || platform === "instagram") {
      jobs.push(getJson(`${ROOT}/instagram/hashtag/posts?name=${encodeURIComponent(tag)}&cursor=&get_author_info=false&token=${token}`)
        .then(d => mapInstagram(d, tag)).catch(() => []));
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
      // Good data: keep it fresh 24h, then serve the last good set (stale) for up to 7 days
      // while revalidating in the background — so users always see trends and we only spend
      // ~1 upstream call per region per day against the free quota.
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
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
