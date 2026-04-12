const fs = require("fs");
const path = require("path");

const toPublicUrl = (req, value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get("host")}${value}`;
};

const deleteProfileImageFile = (imagePath) => {
  if (!imagePath) return;
  const fileName = path.basename(imagePath);
  if (!fileName) return;
  const absolutePath = path.join(__dirname, "../../uploads/profile-images", fileName);
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (_e) {
    // ignore cleanup failures
  }
};

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_e) {
    // ignore
  }
};

module.exports = {
  toPublicUrl,
  deleteProfileImageFile,
  safeUnlink
};
