const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
connectDB();

app.get('/', (req, res) => res.send('Hello Worlds'));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));