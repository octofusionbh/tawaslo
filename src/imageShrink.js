// One place to shrink an image before it is uploaded.
//
// Photos were being stored as full-resolution PNG, which is a lossless format
// meant for logos and screenshots. A 1920px photo costs about 4 MB as PNG and
// under 1 MB as JPEG, and that difference accounted for two thirds of the
// workspace's storage. So unless the caller needs transparency, the result is
// re-encoded as JPEG at the requested long edge.
//
// The original blob is returned untouched whenever re-encoding would not help:
// a GIF or SVG, an image the browser cannot decode, or a result that came out
// no smaller than what we started with.
export const shrinkImageBlob = (blob, opts) => new Promise((resolve) => {
  const { max = 1920, quality = 0.85, keepAlpha = false } = opts || {};
  try {
    const type = String((blob && blob.type) || '');
    if (!blob || !type.startsWith('image/') || type === 'image/gif' || type === 'image/svg+xml') return resolve(blob);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try { URL.revokeObjectURL(url); } catch (e) {}
      const big = Math.max(img.width, img.height) || 1;
      const scale = Math.min(1, max / big);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!keepAlpha) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((out) => resolve(out && out.size < blob.size ? out : blob), keepAlpha ? 'image/png' : 'image/jpeg', quality);
    };
    img.onerror = () => { try { URL.revokeObjectURL(url); } catch (e) {} resolve(blob); };
    img.src = url;
  } catch (e) { resolve(blob); }
});

// The file extension that matches what shrinkImageBlob actually produced, so a
// JPEG never gets stored under a .png name.
export const extensionForBlob = (blob, fallback = 'jpg') => {
  const type = String((blob && blob.type) || '').toLowerCase();
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  if (type === 'image/svg+xml') return 'svg';
  return fallback;
};
