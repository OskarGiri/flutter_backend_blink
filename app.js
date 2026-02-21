// backedNodeBlik/app.js
const express = require("express");
const path = require("path");
const connectDB = require("./config/DB");

const userroutes = require("./routes/user_routes");

// ✅ ADD THESE 3 LINES (new routes)
const discoveryRoutes = require("./routes/discovery_routes");
const swipeRoutes = require("./routes/swipe_routes");
const matchRoutes = require("./routes/match_routes");

const app = express();
connectDB();

app.use(express.json());

// serve uploaded images publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ EXISTING
app.use("/users", userroutes);

// ✅ ADD THESE 3 LINES (mount endpoints)
app.use("/discovery", discoveryRoutes);
app.use("/swipes", swipeRoutes);
app.use("/matches", matchRoutes);

const port = 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});

module.exports = app;