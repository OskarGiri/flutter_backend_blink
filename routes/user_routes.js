const express = require("express");
const router = express.Router();

const { signup, login, findAllUsers } = require("../controller/user_controller");
const { getMe, updateMe } = require("../controller/profile_controller");
const auth = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);

// ✅ Profile
router.get("/me", auth, getMe);
router.put("/me", auth, updateMe);

router.get("/", findAllUsers);

module.exports = router;
