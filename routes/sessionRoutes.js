// File: jobs-ejs/routes/sessionRoutes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
    logonShow,
    registerShow,
    registerDo,
    logoff,
    logonSuccess,  // Import the new function
} = require("../controllers/sessionController");

router.route("/register").get(registerShow).post(registerDo);

// Modified login route to use our custom success handler
router
    .route("/logon")
    .get(logonShow)
    .post(
        passport.authenticate("local", {
            failureRedirect: "/sessions/logon",
            failureFlash: true,
        }),
        logonSuccess  // This runs after successful authentication
    );

router.route("/logoff").post(logoff);

module.exports = router;