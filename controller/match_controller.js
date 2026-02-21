// backedNodeBlik/controller/match_controller.js
const mongoose = require("mongoose");
const Match = require("../models/match");

const listMatches = async (req, res) => {
  try {
    // req.userId from auth middleware is usually a string -> convert
    const me = new mongoose.Types.ObjectId(req.userId);

    const matches = await Match.find({ users: me })
      .sort({ createdAt: -1 })
      .populate("users", "username fullName photos");

    const out = matches.map((m) => {
      const users = Array.isArray(m.users) ? m.users : [];

      const other =
        users.find((u) => u && u._id && u._id.toString() !== me.toString()) ||
        null;

      return {
        id: m._id,
        createdAt: m.createdAt,
        otherUser: other,
      };
    });

    return res.status(200).json(out);
  } catch (e) {
    console.error("Matches error:", e);
    return res.status(500).json({
      message: "Failed to load matches",
      error: e?.message ?? String(e),
    });
  }
};

module.exports = { listMatches };