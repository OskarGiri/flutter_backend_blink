

const User = require("../models/user");
const Swipe = require("../models/swipe");

function toAbsolute(req, p) {
  if (!p) return p;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${req.protocol}://${req.get("host")}${p.startsWith("/") ? "" : "/"}${p}`;
}

const discovery = async (req, res) => {
  try {
    const me = req.userId;

    const swiped = await Swipe.find({ fromUser: me }).select("toUser -_id");
    const swipedIds = swiped.map((s) => s.toUser);

    const users = await User.find({
      _id: { $ne: me, $nin: swipedIds },
    })
      .select("username fullName dob gender lookingFor photos")
      .limit(20);

    const out = users.map((u) => {
      const obj = u.toObject();
      obj.photos = Array.isArray(obj.photos) ? obj.photos.map((p) => toAbsolute(req, p)) : [];
      return obj;
    });

    return res.status(200).json(out);
  } catch (e) {
    console.error("Discovery error:", e);
    return res.status(500).json({ message: "Failed to load discovery" });
  }
};

module.exports = { discovery };