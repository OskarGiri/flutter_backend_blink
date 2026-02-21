// backedNodeBlik/controller/swipe_controller.js
const mongoose = require("mongoose");
const Swipe = require("../models/swipe");
const Match = require("../models/match");

const swipe = async (req, res) => {
  try {
    const fromUser = req.userId; // usually ObjectId string
    const { targetUserId, action } = req.body;

    if (!targetUserId || !["like", "pass"].includes(action)) {
      return res.status(400).json({ message: "Invalid swipe payload" });
    }
    if (targetUserId.toString() === fromUser.toString()) {
      return res.status(400).json({ message: "Cannot swipe yourself" });
    }

    // Ensure ObjectIds
    const fromId = new mongoose.Types.ObjectId(fromUser);
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    await Swipe.findOneAndUpdate(
      { fromUser: fromId, toUser: targetId },
      { $set: { action } },
      { upsert: true, new: true }
    );

    if (action !== "like") {
      return res.status(200).json({ ok: true, matched: false });
    }

    const reciprocal = await Swipe.findOne({
      fromUser: targetId,
      toUser: fromId,
      action: "like",
    }).select("_id");

    if (!reciprocal) {
      return res.status(200).json({ ok: true, matched: false });
    }

    // ✅ Keep ObjectIds, just sort by string compare
    const usersSorted = [fromId, targetId].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

    const match = await Match.findOneAndUpdate(
      { users: usersSorted },
      { $setOnInsert: { users: usersSorted } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      ok: true,
      matched: true,
      matchId: match._id,
    });
  } catch (e) {
    console.error("Swipe error:", e);
    return res.status(500).json({ message: "Swipe failed" });
  }
};

module.exports = { swipe };