// File: jobs-ejs/routes/jobs.js
const express = require("express");
const router = express.Router();
const {
    getAllJobs,
    showNewJobForm,
    createJob,
    showEditJobForm,
    updateJob,
    deleteJob
} = require("../controllers/jobs");

// Routes are matched in order, so specific routes come before general ones
// GET /jobs/new must come before GET /jobs/edit/:id to avoid "new" being treated as an ID

// Display all jobs for the logged-in user
router.get("/", getAllJobs);

// Show form to create a new job (must come before /:id routes)
router.get("/new", showNewJobForm);

// Create a new job from form submission
router.post("/", createJob);

// Show form to edit a specific job
router.get("/edit/:id", showEditJobForm);

// Update a specific job from form submission
router.post("/update/:id", updateJob);

// Delete a specific job
router.post("/delete/:id", deleteJob);

module.exports = router;