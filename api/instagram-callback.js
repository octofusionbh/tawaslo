// api/instagram-callback.js — Instagram OAuth callback, redirects back to app
export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(`https://tawasalo.com/social?ig_error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.redirect(`https://tawasalo.com/social?ig_error=${encodeURIComponent('No code received')}`);
  }

  return res.redirect(`https://tawasalo.com/social?ig_code=${encodeURIComponent(code)}`);
}
