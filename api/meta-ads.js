// api/meta-ads.js — Fetch Meta (Facebook/Instagram) Ads performance data
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accessToken, pageId } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Missing accessToken' });

  const base = 'https://graph.facebook.com/v19.0';

  try {
    // 1. Get ad accounts for this user/page
    const adAccountsRes = await fetch(
      `${base}/me/adaccounts?fields=id,name,account_status,currency,spend_cap,amount_spent&access_token=${accessToken}`
    );
    const adAccountsData = await adAccountsRes.json();

    if (adAccountsData.error) {
      return res.status(400).json({
        error: adAccountsData.error.message,
        code: adAccountsData.error.code,
        needsPermission: adAccountsData.error.code === 200 || adAccountsData.error.code === 190,
      });
    }

    const adAccounts = adAccountsData.data || [];
    if (adAccounts.length === 0) {
      return res.status(200).json({ adAccounts: [], campaigns: [], summary: null });
    }

    // 2. Get campaigns from first active ad account
    const activeAccount = adAccounts.find(a => a.account_status === 1) || adAccounts[0];
    const accountId = activeAccount.id;

    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const until = Math.floor(Date.now() / 1000);

    const campaignsRes = await fetch(
      `${base}/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights{spend,reach,impressions,clicks,cpc,cpm,cpp,actions}&time_range={'since':'${new Date(since*1000).toISOString().split('T')[0]}','until':'${new Date(until*1000).toISOString().split('T')[0]}'}&access_token=${accessToken}`
    );
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      return res.status(400).json({ error: campaignsData.error.message });
    }

    const campaigns = (campaignsData.data || []).map(c => {
      const ins = c.insights?.data?.[0] || {};
      const actions = ins.actions || [];
      const postEngagements = actions.find(a => a.action_type === 'post_engagement')?.value || 0;
      const linkClicks = actions.find(a => a.action_type === 'link_click')?.value || 0;
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        budget: c.daily_budget ? `${(c.daily_budget/100).toFixed(2)}/day` : c.lifetime_budget ? `${(c.lifetime_budget/100).toFixed(2)} total` : '—',
        spend: parseFloat(ins.spend || 0),
        reach: parseInt(ins.reach || 0),
        impressions: parseInt(ins.impressions || 0),
        clicks: parseInt(ins.clicks || 0) || parseInt(linkClicks),
        cpc: parseFloat(ins.cpc || 0),
        cpm: parseFloat(ins.cpm || 0),
        engagements: parseInt(postEngagements),
      };
    });

    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);

    return res.status(200).json({
      adAccounts: adAccounts.map(a => ({ id: a.id, name: a.name, status: a.account_status, currency: a.currency, amountSpent: a.amount_spent })),
      campaigns,
      summary: {
        totalSpend: totalSpend.toFixed(2),
        totalReach,
        totalImpressions,
        totalClicks,
        avgCPC: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0.00',
        avgCPM: totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : '0.00',
      },
    });
  } catch (err) {
    console.error('Meta Ads error:', err);
    return res.status(500).json({ error: 'Failed to fetch ads data', details: err.message });
  }
}
