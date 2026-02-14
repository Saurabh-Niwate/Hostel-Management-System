const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(403).json({ message: "Token required" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};