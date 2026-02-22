// backedNodeBlik/controller/swipe_controller.js
const mongoose = require("mongoose");
const Swipe = require("../models/swipe");
const Match = require("../models/match");

const swipe = async (req, res) => {
  try {
    const fromUser = req.userId;
    const { targetUserId, action } = req.body;

    if (!targetUserId || !["like", "pass"].includes(action)) {
      return res.status(400).json({ message: "Invalid swipe payload" });
    }
    if (targetUserId.toString() === fromUser.toString()) {
      return res.status(400).json({ message: "Cannot swipe yourself" });
    }

    const fromId = new mongoose.Types.ObjectId(fromUser);
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    // ✅ Update legacy(string) OR new(ObjectId) and normalize into ObjectId
    await Swipe.findOneAndUpdate(
      {
        fromUser: { $in: [fromId, fromId.toString()] },
        toUser: { $in: [targetId, targetId.toString()] },
      },
      { $set: { fromUser: fromId, toUser: targetId, action } },
      { upsert: true, returnDocument: "after" } // ✅ mongoose 9
    );

    if (action !== "like") {
      return res.status(200).json({ ok: true, matched: false });
    }

    // ✅ Reciprocal search supports legacy string/ObjectId
    const reciprocal = await Swipe.findOne({
      fromUser: { $in: [targetId, targetId.toString()] },
      toUser: { $in: [fromId, fromId.toString()] },
      action: "like",
    }).select("_id");

    if (!reciprocal) {
      return res.status(200).json({ ok: true, matched: false });
    }

    const usersSorted = [fromId, targetId].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

    let match;
    try {
      match = await Match.findOneAndUpdate(
        { users: usersSorted },
        { $setOnInsert: { users: usersSorted } },
        { upsert: true, returnDocument: "after" } // ✅ mongoose 9
      );
    } catch (e) {
      // race safety if you have a unique index on users
      if (e && e.code === 11000) {
        match = await Match.findOne({ users: usersSorted });
      } else {
        throw e;
      }
    }

    if (!match) {
      return res.status(500).json({ message: "Match upsert returned null" });
    }

    // ✅ REAL-TIME emit to both users
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${fromId.toString()}`).emit("match:new", {
        matchId: match._id.toString(),
        otherUserId: targetId.toString(),
      });
      io.to(`user:${targetId.toString()}`).emit("match:new", {
        matchId: match._id.toString(),
        otherUserId: fromId.toString(),
      });
    }

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