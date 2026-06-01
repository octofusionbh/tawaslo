// api/instagram-callback.js — Instagram OAuth callback page
export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(200).send(`
      <html><body><script>
        window.opener && window.opener.postMessage({ type: 'ig_oauth_error', error: '${error_description || error}' }, '*');
        window.close();
      </script></body></html>
    `);
  }

  if (!code) {
    return res.status(200).send(`
      <html><body><script>
        window.opener && window.opener.postMessage({ type: 'ig_oauth_error', error: 'No code received' }, '*');
        window.close();
      </script></body></html>
    `);
  }

  return res.status(200).send(`
    <html><body><script>
      window.opener && window.opener.postMessage({ type: 'ig_oauth_code', code: '${code}' }, '*');
      window.close();
    </script></body></html>
  `);
}
