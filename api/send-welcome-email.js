// api/send-welcome-email.js — Send welcome email via Resend
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, plan, accountType } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Resend API key not configured' });

  const planLimits = {
    starter:      { accounts: 3,   members: 1, posts: 30  },
    professional: { accounts: 10,  members: 5, posts: 100 },
    agency:       { accounts: 999, members: 20, posts: 999 },
  };

  const limits = planLimits[plan?.toLowerCase()] || planLimits.professional;
  const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Professional';
  const planPrice = plan === 'starter' ? 49 : plan === 'agency' ? 199 : 99;
  const greeting = accountType === 'freelancer' ? `Hi ${name},` : `Hi ${name},`;
  const accountsDisplay = limits.accounts === 999 ? 'Unlimited' : limits.accounts;
  const postsDisplay = limits.posts === 999 ? 'Unlimited' : limits.posts;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Welcome to Tawaslo</title>
</head>
<body style="margin:0;padding:0;background:#0B1221;font-family:-apple-system,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1221;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0D1828;border-radius:16px;border:1px solid #1C2D45;overflow:hidden;max-width:560px;width:100%;">

  <!-- HERO -->
  <tr><td style="background:#07090F;padding:40px 40px 0;text-align:center;border-bottom:1px solid #1C2D45;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <img src="https://tawaslo.com/logo-transparent.png" width="36" height="36" alt="Tawaslo" style="display:block;"/>
        </td>
        <td style="vertical-align:middle;font-size:22px;font-weight:800;color:#E8EFF8;letter-spacing:-0.5px;">Tawaslo</td>
      </tr>
    </table>
    <h1 style="font-size:26px;font-weight:800;color:#E8EFF8;margin:0 0 12px;line-height:1.25;">You are in. Let's build something great.</h1>
    <p style="font-size:14px;color:#7A8BA8;margin:0 0 24px;line-height:1.7;">Your Tawaslo workspace is live and ready.<br>Everything you need to manage social media like a pro.</p>
    <a href="https://tawaslo.com" style="display:inline-block;background:#4F6EF7;color:#fff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;margin-bottom:28px;">Go to my dashboard</a>

    <!-- MOCKUP -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1221;border-radius:12px 12px 0 0;border:1px solid #1C2D45;border-bottom:none;margin-top:4px;">
      <tr><td style="background:#141E30;border-radius:8px 8px 0 0;padding:8px 12px;border-bottom:1px solid #1C2D45;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:8px;height:8px;border-radius:50%;background:#FF5F57;margin-right:4px;"></td>
          <td width="6"></td>
          <td style="width:8px;height:8px;border-radius:50%;background:#FEBC2E;"></td>
          <td width="6"></td>
          <td style="width:8px;height:8px;border-radius:50%;background:#28C840;"></td>
          <td width="12"></td>
          <td style="background:#0D1828;border-radius:4px;padding:3px 10px;font-size:10px;color:#7A8BA8;">tawaslo.com/publisher</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#07090F;padding:14px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="140" valign="top" style="background:#0D1828;border-radius:8px;padding:10px;border:1px solid #1C2D45;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #1C2D45;">
              <div style="width:18px;height:18px;border-radius:5px;background:linear-gradient(135deg,#4F6EF7,#7C3AED);display:inline-block;"></div>
              <span style="font-size:10px;font-weight:800;color:#E8EFF8;margin-left:6px;">Tawaslo</span>
            </div>
            <div style="font-size:9px;color:#4F6EF7;background:rgba(79,110,247,0.15);padding:5px 6px;border-radius:5px;margin-bottom:3px;">Publisher</div>
            <div style="font-size:9px;color:#7A8BA8;padding:5px 6px;margin-bottom:3px;">Inbox</div>
            <div style="font-size:9px;color:#7A8BA8;padding:5px 6px;margin-bottom:3px;">Analytics</div>
            <div style="font-size:9px;color:#7A8BA8;padding:5px 6px;margin-bottom:3px;">Campaigns</div>
            <div style="font-size:9px;color:#7A8BA8;padding:5px 6px;margin-bottom:3px;">Reports</div>
          </td>
          <td width="12"></td>
          <td valign="top" style="background:#0D1828;border-radius:8px;padding:12px;border:1px solid #1C2D45;">
            <div style="font-size:11px;font-weight:700;color:#E8EFF8;margin-bottom:10px;">Create a post</div>
            <div style="background:#111827;border-radius:6px;padding:8px;font-size:8px;color:#7A8BA8;margin-bottom:8px;border:1px solid #1C2D45;line-height:1.5;">Introducing Tawaslo — built for agencies worldwide. Publish, schedule, and grow. 🚀</div>
            <div style="background:#111827;border-radius:6px;height:32px;margin-bottom:8px;border:1px dashed #1C2D45;"></div>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
              <td style="background:rgba(24,119,242,0.15);color:#1877F2;font-size:7px;font-weight:700;padding:3px 8px;border-radius:20px;margin-right:4px;">Facebook</td>
              <td width="4"></td>
              <td style="background:rgba(225,48,108,0.15);color:#E1306C;font-size:7px;font-weight:700;padding:3px 8px;border-radius:20px;">Instagram</td>
            </tr></table>
            <div style="background:#4F6EF7;color:#fff;font-size:8px;font-weight:700;padding:5px 12px;border-radius:5px;display:inline-block;">Publish Now</div>
            <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:5px;padding:4px 8px;font-size:7px;color:#10B981;margin-top:6px;">✓ Posted successfully!</div>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:36px 40px;">
    <p style="font-size:16px;font-weight:700;color:#E8EFF8;margin:0 0 10px;">${greeting}</p>
    <p style="font-size:14px;color:#A8B9CE;line-height:1.75;margin:0 0 28px;">Welcome to Tawaslo, the social media management platform built for agencies, freelancers, and brands worldwide. Your workspace is set up and ready to go.</p>

    <!-- PLAN BOX -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid rgba(79,110,247,0.3);border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:18px 22px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><div style="font-size:11px;color:#7A8BA8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Active plan</div>
              <div style="font-size:18px;font-weight:800;color:#4F6EF7;">${planName}</div></td>
              <td align="right"><div style="font-size:26px;font-weight:800;color:#E8EFF8;">$${planPrice}</div>
              <div style="font-size:12px;color:#7A8BA8;">per month</div></td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1C2D45;margin-top:14px;padding-top:14px;">
            <tr>
              <td align="center"><div style="font-size:16px;font-weight:800;color:#4F6EF7;">${accountsDisplay}</div><div style="font-size:10px;color:#7A8BA8;margin-top:2px;">Social accounts</div></td>
              <td align="center"><div style="font-size:16px;font-weight:800;color:#4F6EF7;">${limits.members}</div><div style="font-size:10px;color:#7A8BA8;margin-top:2px;">Team members</div></td>
              <td align="center"><div style="font-size:16px;font-weight:800;color:#4F6EF7;">${postsDisplay}</div><div style="font-size:10px;color:#7A8BA8;margin-top:2px;">Posts per month</div></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- SOCIAL PROOF -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1C2D45;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td align="center"><div style="font-size:22px;font-weight:800;color:#4F6EF7;">500+</div><div style="font-size:10px;color:#7A8BA8;margin-top:3px;">Brands managed</div></td>
          <td align="center"><div style="font-size:22px;font-weight:800;color:#4F6EF7;">10K+</div><div style="font-size:10px;color:#7A8BA8;margin-top:3px;">Posts published</div></td>
          <td align="center"><div style="font-size:22px;font-weight:800;color:#4F6EF7;">98%</div><div style="font-size:10px;color:#7A8BA8;margin-top:3px;">Satisfaction rate</div></td>
        </tr></table>
      </td></tr>
    </table>

    <!-- FEATURES -->
    <p style="font-size:15px;font-weight:700;color:#E8EFF8;margin:0 0 6px;">Everything in one place</p>
    <p style="font-size:12px;color:#7A8BA8;margin:0 0 16px;line-height:1.6;">From publishing to monitoring to reporting, Tawaslo handles it all so you can focus on growing your clients.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">Publish content</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Post to Facebook and Instagram instantly or schedule ahead</div>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">Schedule posts</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Plan your content calendar days or weeks in advance</div>
        </td>
      </tr>
      <tr><td colspan="3" height="8"></td></tr>
      <tr>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">Unified inbox</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Monitor all comments and DMs from every platform</div>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">AI captions</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Generate captions in English and Arabic in seconds</div>
        </td>
      </tr>
      <tr><td colspan="3" height="8"></td></tr>
      <tr>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">Analytics</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Track followers, reach, and engagement per client</div>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">Multi-client workspace</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Manage all your brands from one dashboard</div>
        </td>
      </tr>
      <tr><td colspan="3" height="8"></td></tr>
      <tr>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">Campaigns</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Plan and run multi-platform campaigns for your clients</div>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="background:#111827;border-radius:10px;padding:14px;border:1px solid #1C2D45;">
          <div style="font-size:12px;font-weight:700;color:#E8EFF8;margin-bottom:3px;">Reports</div>
          <div style="font-size:11px;color:#7A8BA8;line-height:1.5;">Monthly performance reports ready to share with clients</div>
        </td>
      </tr>
    </table>

    <!-- DIVIDER -->
    <div style="border-top:1px solid #1C2D45;margin:24px 0;"></div>

    <!-- STEPS -->
    <p style="font-size:15px;font-weight:700;color:#E8EFF8;margin:0 0 14px;">Get started in 3 steps</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;width:100%;"><tr>
      <td width="28" valign="top"><div style="width:28px;height:28px;border-radius:50%;background:#4F6EF7;color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;">1</div></td>
      <td width="14"></td>
      <td><div style="font-size:13px;font-weight:700;color:#E8EFF8;margin-bottom:2px;">Connect your social accounts</div><div style="font-size:12px;color:#7A8BA8;line-height:1.5;">Go to Social Accounts and connect your Facebook Pages and Instagram Business accounts.</div></td>
    </tr></table>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;width:100%;"><tr>
      <td width="28" valign="top"><div style="width:28px;height:28px;border-radius:50%;background:#4F6EF7;color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;">2</div></td>
      <td width="14"></td>
      <td><div style="font-size:13px;font-weight:700;color:#E8EFF8;margin-bottom:2px;">Add your clients</div><div style="font-size:12px;color:#7A8BA8;line-height:1.5;">Create a workspace for each brand or client you manage. Keep everything separate and organized.</div></td>
    </tr></table>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%;"><tr>
      <td width="28" valign="top"><div style="width:28px;height:28px;border-radius:50%;background:#4F6EF7;color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;">3</div></td>
      <td width="14"></td>
      <td><div style="font-size:13px;font-weight:700;color:#E8EFF8;margin-bottom:2px;">Publish your first post</div><div style="font-size:12px;color:#7A8BA8;line-height:1.5;">Head to the Publisher, write a caption, upload an image, and go live or schedule it for later.</div></td>
    </tr></table>

    <!-- DIVIDER -->
    <div style="border-top:1px solid #1C2D45;margin:24px 0;"></div>

    <!-- CLOSING -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;border:1px solid #1C2D45;margin-bottom:24px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="font-size:13px;color:#A8B9CE;line-height:1.7;margin:0 0 16px;">We built Tawaslo for agencies and brands like yours, anywhere in the world. Whether you are managing 2 clients or 200, we are here to make social media management faster, smarter, and more professional.<br><br>If you ever need help, just reply to this email. We read every message.</p>
        <a href="https://tawaslo.com" style="display:inline-block;background:#4F6EF7;color:#fff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;">Start publishing now</a>
      </td></tr>
    </table>

    <p style="font-size:12px;color:#7A8BA8;text-align:center;margin:0;">Questions? <a href="mailto:support@tawaslo.com" style="color:#4F6EF7;text-decoration:none;">support@tawaslo.com</a></p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#07090F;padding:22px 40px;text-align:center;border-top:1px solid #1C2D45;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
      <tr>
        <td style="padding:0 5px;">
          <a href="https://tawaslo.com" style="display:block;width:36px;height:36px;border-radius:9px;background:#111827;border:1px solid #1C2D45;text-align:center;line-height:36px;text-decoration:none;">
            <img src="https://img.icons8.com/ios/20/7A8BA8/globe--v1.png" width="16" height="16" alt="Website" style="margin-top:10px;"/>
          </a>
        </td>
        <td style="padding:0 5px;">
          <a href="https://instagram.com/tawaslo" style="display:block;width:36px;height:36px;border-radius:9px;background:#111827;border:1px solid #1C2D45;text-align:center;line-height:36px;text-decoration:none;">
            <img src="https://img.icons8.com/ios/20/7A8BA8/instagram-new--v1.png" width="16" height="16" alt="Instagram" style="margin-top:10px;"/>
          </a>
        </td>
        <td style="padding:0 5px;">
          <a href="https://linkedin.com/company/tawaslo" style="display:block;width:36px;height:36px;border-radius:9px;background:#111827;border:1px solid #1C2D45;text-align:center;line-height:36px;text-decoration:none;">
            <img src="https://img.icons8.com/ios/20/7A8BA8/linkedin--v1.png" width="16" height="16" alt="LinkedIn" style="margin-top:10px;"/>
          </a>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
      <tr>
        <td style="padding:0 10px;"><a href="https://tawaslo.com" style="font-size:12px;color:#3D5068;text-decoration:none;">Home</a></td>
        <td style="padding:0 10px;"><a href="https://tawaslo.com/privacy.html" style="font-size:12px;color:#3D5068;text-decoration:none;">Privacy</a></td>
        <td style="padding:0 10px;"><a href="https://tawaslo.com/terms.html" style="font-size:12px;color:#3D5068;text-decoration:none;">Terms</a></td>
        <td style="padding:0 10px;"><a href="#" style="font-size:12px;color:#3D5068;text-decoration:none;">Unsubscribe</a></td>
      </tr>
    </table>
    <div style="font-size:11px;color:#3D5068;">© 2026 Tawaslo. All rights reserved.</div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tawaslo <support@tawaslo.com>',
        to: [email],
        subject: `Welcome to Tawaslo — your workspace is live`,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data.message || 'Failed to send email' });
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send welcome email', details: err.message });
  }
}
