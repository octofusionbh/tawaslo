// api/meta-callback.js — OAuth redirect landing page
// Meta redirects here after user authorizes the app
export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`
      <html><body>
        <script>
          window.opener && window.opener.postMessage({ type: 'meta_oauth_error', error: '${error}' }, '*');
          window.close();
        </script>
        <p>Authorization failed. You can close this window.</p>
      </body></html>
    `);
  }

  if (code) {
    return res.send(`
      <html><body>
        <script>
          // The parent window polls location.href — it will detect the code in the URL
          // and handle the exchange. Just stay on this page briefly.
          document.title = 'Connected!';
        </script>
        <p style="font-family:sans-serif;text-align:center;margin-top:100px">
          ✅ Connected! Closing window...
        </p>
      </body></html>
    `);
  }

  return res.status(400).send('Invalid callback');
}
