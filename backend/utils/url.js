function getBaseUrl(req) {
  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
}

/**
 * Converts relative `/uploads/...` paths into full `http(s)://<host>/uploads/...` URLs
 * so mobile clients (SwiftUI AsyncImage / URLSession) can download images directly.
 */
function resolveImageUrl(req, imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  const trimmed = imageUrl.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${getBaseUrl(req)}${normalizedPath}`;
}

/**
 * Strips the current server origin prefix from `/uploads/...` URLs before writing to SQLite
 * so stored paths stay host/IP-independent while API responses always emit full URLs.
 */
function normalizeStoredImageUrl(req, imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  const trimmed = imageUrl.trim();
  if (!trimmed) return trimmed;

  const baseUrl = getBaseUrl(req);
  if (trimmed.startsWith(`${baseUrl}/uploads/`)) {
    return trimmed.slice(baseUrl.length);
  }
  return trimmed;
}

module.exports = {
  getBaseUrl,
  resolveImageUrl,
  normalizeStoredImageUrl
};

