// backedNodeBlik/routes/match_routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { listMatches } = require("../controller/match_controller");

router.get("/", auth, listMatches);

module.exports = router;