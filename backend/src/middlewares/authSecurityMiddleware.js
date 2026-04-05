const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = process.env.NODE_ENV === "production" ? 10 : 50;
const AUTH_MAX_IDENTIFIER_LENGTH = 100;
const AUTH_MAX_PASSWORD_LENGTH = 128;

const attempts = new Map();

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, value] of attempts.entries()) {
    if (value.expiresAt <= now) {
      attempts.delete(key);
    }
  }
};

setInterval(cleanupExpiredEntries, 5 * 60 * 1000).unref();

const getClientKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwardedFor === "string" && forwardedFor.split(",")[0].trim()) ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";
  const identifier =
    req.path === "/login" && req.body?.identifier
      ? String(req.body.identifier).trim().toUpperCase()
      : "";
  return identifier ? `auth:${ip}:${identifier}` : `auth:${ip}`;
};

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

exports.authRateLimiter = (req, res, next) => {
  const key = getClientKey(req);
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing || existing.expiresAt <= now) {
    attempts.set(key, {
      count: 1,
      expiresAt: now + AUTH_WINDOW_MS
    });
    return next();
  }

  if (existing.count >= AUTH_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: "Too many authentication attempts. Please try again later."
    });
  }

  existing.count += 1;
  return next();
};

exports.clearAuthAttempts = (req) => {
  attempts.delete(getClientKey(req));
};

exports.validateLoginPayload = (req, res, next) => {
  const identifier = normalizeOptionalString(req.body?.identifier);
  const password = normalizeOptionalString(req.body?.password);

  if (!identifier.trim() || !password.trim()) {
    return res.status(400).json({ message: "identifier and password are required" });
  }

  if (identifier.length > AUTH_MAX_IDENTIFIER_LENGTH) {
    return res.status(413).json({ message: "identifier is too long" });
  }

  if (password.length > AUTH_MAX_PASSWORD_LENGTH) {
    return res.status(413).json({ message: "password is too long" });
  }

  req.body.identifier = identifier.trim();
  req.body.password = password;
  return next();
};

exports.validateChangePasswordPayload = (req, res, next) => {
  const oldPassword = normalizeOptionalString(req.body?.oldPassword);
  const newPassword = normalizeOptionalString(req.body?.newPassword);
  const confirmPassword = normalizeOptionalString(req.body?.confirmPassword);

  if (!oldPassword.trim() || !newPassword.trim()) {
    return res.status(400).json({ message: "oldPassword and newPassword are required" });
  }

  if (
    oldPassword.length > AUTH_MAX_PASSWORD_LENGTH ||
    newPassword.length > AUTH_MAX_PASSWORD_LENGTH ||
    confirmPassword.length > AUTH_MAX_PASSWORD_LENGTH
  ) {
    return res.status(413).json({ message: "password is too long" });
  }

  req.body.oldPassword = oldPassword;
  req.body.newPassword = newPassword;
  req.body.confirmPassword = confirmPassword;
  return next();
};
