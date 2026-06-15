const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const svgRoutes = require("./routes/svgRoutes");

const app = express();

app.use(cors());
app.use(express.json({
  limit: "50mb"
}));
app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}));

app.use("/api", svgRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.log(err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});