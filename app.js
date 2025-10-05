// File: jobs-ejs/app.js
// Main application entry point with Express server configuration

require("express-async-errors");
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("host-csrf");
const cookieParser = require("cookie-parser");

// Security packages
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

// Load environment variables
require("dotenv").config();

const app = express();

// Security Configuration
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// XSS-Clean sanitizes user input coming from POST body, GET queries, and url params
app.use(xss());

// Rate limiting to prevent brute force attacks
const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use("/sessions", limiter); // Apply rate limiting to authentication routes

// View engine setup
app.set("view engine", "ejs");

// Session store configuration
const sessionStore = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: "sessions"
});

// Session configuration
const sessionParams = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false, sameSite: "strict" }
};

// Middleware stack - ORDER MATTERS!
// 1. Cookie parser (must come before CSRF)
app.use(cookieParser(process.env.SESSION_SECRET));

// 2. Body parser (must come before CSRF)
app.use(require("body-parser").urlencoded({ extended: true }));

// 3. Session middleware
app.use(session(sessionParams));

// 4. CSRF Protection Configuration
// Using host-csrf for CSRF protection
// Note: We're using csrf.csrf() not csrf.token() as per the documentation
let csrf_development_mode = (app.get("env") !== "production");
let csrf_protection_middleware = csrf.csrf({
    protected_operations: ["POST", "PUT", "PATCH", "DELETE"],
    development_mode: csrf_development_mode,  // Show warnings in dev mode
    cookie_options: {
        sameSite: "strict"
    }
});
app.use(csrf_protection_middleware);

// 5. CSRF Token Generation Middleware
// The host-csrf package requires explicit token refresh for each request
// This middleware ensures a CSRF token is available for all views
app.use((req, res, next) => {
    // Generate CSRF token for all requests that might need it
    // The host-csrf package requires explicit token refresh
    // This will set res.locals._csrf automatically
    csrf.refreshToken(req, res);
    next();
});

// 6. Passport Authentication
const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// 7. Flash messages and local variables
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

// ROUTES SECTION
// Home page route
app.get("/", (req, res) => {
    // Token is already available from our middleware
    res.render("index");
});

// Mount session routes (login, logout, register)
app.use("/sessions", require("./routes/sessionRoutes"));

// Authentication middleware - protects routes that require login
const auth = require("./middleware/auth");

// Protected routes
const secretWordRouter = require("./routes/secretWord");
const jobsRouter = require("./routes/jobs");

// Secret word routes (from previous assignments)
app.use("/secretWord", auth, secretWordRouter);

// Protected jobs routes - require authentication
app.use("/jobs", auth, jobsRouter);

// 404 Handler - catches requests that don't match any route
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// ERROR HANDLING MIDDLEWARE
// This must be the last middleware in the stack
// Error handlers have 4 parameters: err, req, res, next
app.use((err, req, res, next) => {
    // Log the full error for debugging purposes (but not in production)
    // This helps developers debug issues without exposing info to users
    if (app.get("env") === "development") {
        console.error("Error details:", err);
    }

    // Handle CSRF token errors specifically
    // These should return 403 Forbidden, not 500 Internal Server Error
    // CSRF errors indicate a security issue, not a server malfunction
    if (err.name === "CSRFError" || err.message.includes("CSRF")) {
        return res.status(403).send("Forbidden: Invalid or missing CSRF token. Please refresh the page and try again.");
    }

    // Handle validation errors (from Mongoose or other validators)
    // These are user errors, not server errors, so return 400 Bad Request
    // Validation errors mean the user provided invalid data
    if (err.name === "ValidationError") {
        return res.status(400).send("Validation Error: Please check your input and try again.");
    }

    // Handle authentication errors
    // These should return 401 Unauthorized
    // Authentication errors mean the user needs to log in
    if (err.name === "UnauthorizedError" || err.message.includes("unauthorized")) {
        return res.status(401).send("Unauthorized: Please log in to continue.");
    }

    // Handle "not found" errors
    // These should return 404 Not Found
    // These occur when a requested resource doesn't exist
    if (err.status === 404 || err.message.includes("not found")) {
        return res.status(404).send("Not Found: The requested resource does not exist.");
    }

    // Default: treat as internal server error
    // In production, never expose the actual error message to users
    // Error messages might contain sensitive information about your system
    const message = app.get("env") === "production"
        ? "Internal Server Error: Something went wrong on our end."
        : err.message || "Internal Server Error";

    res.status(err.status || 500).send(message);
});

// Server startup
const port = process.env.PORT || 3000;
const start = async () => {
    try {
        // Connect to MongoDB before starting the server
        await require("./db/connect")(process.env.MONGODB_URI);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();