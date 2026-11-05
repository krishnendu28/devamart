// Small, dependency-free security helpers shared by the API.
// (Keeping this local avoids adding packages to a serverless bundle.)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 15);
}

function cleanText(value, max = 500) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function isValidEmail(value) {
  const email = normalizeEmail(value);
  return email.length >= 5 && email.length <= 254 && EMAIL_RE.test(email);
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * In-memory fixed-window rate limiter. Serverless instances each keep their own
 * window, which is still enough to stop password guessing / form spam bursts.
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 30, message = 'Too many attempts. Please wait a few minutes and try again.' } = {}) {
  const buckets = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    // Opportunistic cleanup so the Map cannot grow forever.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    }
    const key = clientIp(req);
    let bucket = buckets.get(key);
    if (!bucket || bucket.reset <= now) {
      bucket = { count: 0, reset: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(bucket.reset / 1000)));

    if (bucket.count > max) {
      const retry = Math.max(1, Math.ceil((bucket.reset - now) / 1000));
      res.set('Retry-After', String(retry));
      return res.status(429).json({ error: message, retry_after: retry });
    }
    next();
  };
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

function securityHeaders(req, res, next) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.set(key, value);
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
}

/** Restrict CORS to the DevaMart storefront/admin plus local development. */
function corsOrigin(extraOrigins = []) {
  const allowed = new Set([
    'https://devamart-shop.vercel.app',
    'https://devamart-admin.vercel.app',
    'https://devamart-api.vercel.app',
    ...extraOrigins,
  ]);

  return function origin(origin, callback) {
    if (!origin) return callback(null, true); // curl / same-origin / server-to-server
    if (allowed.has(origin)) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // Vercel preview deployments for this project (safe, still project-scoped).
    if (/^https:\/\/devamart-[a-z0-9-]+\.vercel\.app$/.test(origin)) return callback(null, true);
    return callback(null, false);
  };
}

module.exports = {
  EMAIL_RE,
  normalizeEmail,
  normalizePhone,
  cleanText,
  isValidEmail,
  clientIp,
  rateLimit,
  securityHeaders,
  corsOrigin,
};
