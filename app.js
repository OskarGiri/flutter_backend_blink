const express = require("express");//installing express library
const connectDB = require("./config/DB");
const userroutes = require("./routes/user_routes");


const app = express();//definig an express server called app
connectDB();

app.use(express.json());//saying to our app server, to use json function of the express server for parsing json requests
app.use("/users", userroutes);

const port = 3000;

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});


module.exports = app;