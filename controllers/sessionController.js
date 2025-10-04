// File: jobs-ejs/controllers/sessionController.js
const User = require("../models/User");
const parseVErr = require("../utils/parseValidationErr");
const csrf = require("host-csrf");  // Need to import the csrf package

const registerShow = (req, res) => {
    // When showing the registration form, ensure a CSRF token exists
    // This is important because the form needs the token to submit successfully
    if (!res.locals._csrf) {
        csrf.refreshToken(req, res);
    }
    res.render("register");
};

const registerDo = async (req, res, next) => {
    // First, check if passwords match
    if (req.body.password != req.body.password1) {
        req.flash("error", "The passwords entered do not match.");
        // Ensure CSRF token persists when re-rendering the form after an error
        if (!res.locals._csrf) {
            csrf.refreshToken(req, res);
        }
        return res.render("register", { errors: req.flash("error") });
    }

    try {
        // Create the new user
        const newUser = await User.create(req.body);

        // After successful registration, log the user in automatically
        // This is a better user experience than making them log in separately
        req.login(newUser, (err) => {
            if (err) {
                return next(err);
            }
            // Generate a CSRF token for the newly authenticated session
            // This ensures the user can immediately use protected forms
            csrf.refreshToken(req, res);

            // Redirect to home page or a welcome page
            res.redirect("/");
        });

    } catch (e) {
        // Handle various types of errors that might occur during registration
        if (e.constructor.name === "ValidationError") {
            parseVErr(e, req);
        } else if (e.name === "MongoServerError" && e.code === 11000) {
            req.flash("error", "That email address is already registered.");
        } else {
            return next(e);
        }

        // Ensure CSRF token persists when re-rendering the form after an error
        if (!res.locals._csrf) {
            csrf.refreshToken(req, res);
        }
        return res.render("register", { errors: req.flash("error") });
    }
};

const logoff = (req, res) => {
    // When logging off, destroy the entire session
    // This automatically clears the CSRF token along with authentication
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        }
        res.redirect("/");
    });
};

const logonShow = (req, res) => {
    // If user is already logged in, redirect to home
    if (req.user) {
        return res.redirect("/");
    }

    // When showing the login form, ensure a CSRF token exists
    // This is needed for the login form to submit successfully
    if (!res.locals._csrf) {
        csrf.refreshToken(req, res);
    }

    res.render("logon", {
        errors: req.flash("error"),
        info: req.flash("info"),
    });
};

// This is a new function we need to add for successful login handling
// We'll use this instead of Passport's default success redirect
const logonSuccess = (req, res) => {
    // After successful login, generate a fresh CSRF token for this session
    csrf.refreshToken(req, res);

    // Redirect to the intended destination or home page
    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;  // Clean up the returnTo value
    res.redirect(redirectTo);
};

module.exports = {
    registerShow,
    registerDo,
    logoff,
    logonShow,
    logonSuccess,  // Export the new function
};