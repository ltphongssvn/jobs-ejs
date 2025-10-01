// File: jobs-ejs/app.js
require("dotenv").config();
const express = require("express");
require("express-async-errors");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const app = express();
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});

store.on("error", function (error) {
  console.log(error);
});

const sessionParams = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParams.cookie.secure = true;
}

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(session(sessionParams));

// Initialize Passport after session
const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// Add connect-flash and storeLocals middleware
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

// Home page route
app.get("/", (req, res) => {
  res.render("index");
});

// Mount session routes for authentication
app.use("/sessions", require("./routes/sessionRoutes"));

// Protected secretWord routes with authentication middleware
const auth = require("./middleware/auth");
const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", auth, secretWordRouter);

// Error handling middleware
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    // Connect to database before starting server
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
