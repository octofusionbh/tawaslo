// api/trends.js — Live trending TikTok + Instagram posts via EnsembleData
// Token is read from the ENSEMBLE_TOKEN environment variable (never hardcoded).
const ROOT = "https://ensembledata.com/apis";

// Region -> a couple of representative hashtags (kept small to respect the free unit budget).
const REGION_TAGS = {
  worldwide: ["fyp", "viral"],
  gcc:       ["khaleeji", "gulf"],
  bahrain:   ["bahrain", "bahrainfood"],
  saudi:     ["saudi", "riyadh"],
  uae:       ["dubai", "uae"],
  usa:       ["fyp", "trending"],
};

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

async function tiktokTrending(token, tags) {
  const out = [];
  for (const tag of tags) {
    try {
      const url = `${ROOT}/tt/hashtag/posts?name=${encodeURIComponent(tag)}&cursor=0&token=${token}`;
      const data = await getJson(url);
      const posts = data?.data?.aweme_list || data?.data?.posts || data?.posts || (Array.isArray(data?.data) ? data.data : []) || [];
      for (const p of posts) {
        const a = p.aweme_info || p;
        const stats = a.statistics || a;
        const author = a.author || {};
        const cover = a.video?.cover?.url_list?.[0] || a.video?.origin_cover?.url_list?.[0] || a.cover?.url_list?.[0] || a.cover || null;
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
    } catch (e) { /* skip this tag */ }
  }
  return out;
}

async function instagramTrending(token, tags) {
  const out = [];
  for (const tag of tags) {
    try {
      const url = `${ROOT}/instagram/hashtag/posts?name=${encodeURIComponent(tag)}&cursor=&get_author_info=false&token=${token}`;
      const data = await getJson(url);
      const posts = data?.data?.posts || data?.data?.items || data?.posts || (Array.isArray(data?.data) ? data.data : []) || [];
      for (const p of posts) {
        const n = p.node || p;
        const code = n.shortcode || n.code;
        const cover = n.thumbnail_src || n.display_url || n.image_versions?.items?.[0]?.url || n.thumbnail || null;
        const caption = n.caption?.text || n.edge_media_to_caption?.edges?.[0]?.node?.text || (typeof n.caption === "string" ? n.caption : "");
        const likes = n.like_count || n.edge_liked_by?.count || n.edge_media_preview_like?.count || 0;
        out.push({
          platform: "instagram",
          id: String(n.id || code || ""),
          caption,
          author: n.owner?.username || n.user?.username ? "@" + (n.owner?.username || n.user?.username) : "",
          thumbnail: typeof cover === "string" ? cover : null,
          url: code ? `https://www.instagram.com/p/${code}/` : "",
          views: n.video_view_count || n.view_count || 0,
          likes,
          hashtag: tag,
        });
      }
    } catch (e) { /* skip this tag */ }
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

  try {
    let tt = [], ig = [];
    if (platform === "all" || platform === "tiktok") tt = await tiktokTrending(token, tags);
    if (platform === "all" || platform === "instagram") ig = await instagramTrending(token, tags);

    // Fallback cascade: if the chosen region is thin, widen to worldwide.
    if (tt.length + ig.length < 4 && region !== "worldwide") {
      const wt = REGION_TAGS.worldwide;
      if (platform === "all" || platform === "tiktok") tt = tt.concat(await tiktokTrending(token, wt));
      if (platform === "all" || platform === "instagram") ig = ig.concat(await instagramTrending(token, wt));
    }

    let items = [...tt, ...ig].filter(i => i.thumbnail);
    // de-dup by id
    const seen = new Set();
    items = items.filter(i => (seen.has(i.id) ? false : (seen.add(i.id), true)));
    items.sort((a, b) => (b.views + b.likes) - (a.views + a.likes));
    items = items.slice(0, 24);

    // Cache at the CDN ~12h so we sip the free unit budget (refreshes ~daily).
    res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=86400");
    return res.status(200).json({ connected: true, region, platform, items, updatedAt: Date.now() });
  } catch (e) {
    return res.status(200).json({ connected: true, items: [], error: e.message });
  }
}
