// File: jobs-ejs/controllers/jobs.js
const Job = require("../models/Job");
const parseValidationErr = require("../utils/parseValidationErr");

// Display all jobs belonging to the logged-in user
const getAllJobs = async (req, res) => {
    try {
        // Find only jobs created by the current user
        // req.user._id comes from Passport after authentication
        const jobs = await Job.find({ createdBy: req.user._id }).sort('-createdAt');

        // Render the jobs list view, passing the jobs array
        res.render("jobs", { jobs });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        req.flash("error", "Unable to fetch your jobs. Please try again.");
        res.redirect("/");
    }
};

// Show the form to create a new job
const showNewJobForm = (req, res) => {
    // Pass job: null to indicate this is a new job (not an edit)
    // The view will use this to determine form behavior
    res.render("job", {
        job: null,
        errors: req.flash("error")
    });
};

// Create a new job from form submission
const createJob = async (req, res) => {
    try {
        // Add the current user's ID to the job data
        // This ensures the job is associated with the creator
        const jobData = {
            ...req.body,
            createdBy: req.user._id
        };

        // Create the job in the database
        await Job.create(jobData);

        req.flash("info", "Job application added successfully!");
        res.redirect("/jobs");
    } catch (error) {
        // Handle validation errors specifically
        if (error.constructor.name === "ValidationError") {
            parseValidationErr(error, req);
            // Re-render the form with the error messages
            return res.render("job", {
                job: req.body,  // Preserve user input
                errors: req.flash("error")
            });
        }

        // Handle any other errors
        console.error("Error creating job:", error);
        req.flash("error", "Unable to create job. Please try again.");
        res.redirect("/jobs");
    }
};

// Show the form to edit an existing job
const showEditJobForm = async (req, res) => {
    try {
        // Find the job by ID, but ONLY if it belongs to the current user
        // This prevents users from editing other users' jobs
        const job = await Job.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        // If job doesn't exist or doesn't belong to user
        if (!job) {
            req.flash("error", "Job not found or you don't have permission to edit it.");
            return res.redirect("/jobs");
        }

        // Render the edit form with the existing job data
        res.render("job", {
            job,
            errors: req.flash("error")
        });
    } catch (error) {
        console.error("Error fetching job for edit:", error);
        req.flash("error", "Unable to fetch job details. Please try again.");
        res.redirect("/jobs");
    }
};

// Update an existing job from form submission
const updateJob = async (req, res) => {
    try {
        // Update the job, but ONLY if it belongs to the current user
        // findOneAndUpdate returns the updated document
        const job = await Job.findOneAndUpdate(
            {
                _id: req.params.id,
                createdBy: req.user._id  // Security check
            },
            req.body,
            {
                new: true,  // Return the updated document
                runValidators: true  // Run schema validators on update
            }
        );

        // If job doesn't exist or doesn't belong to user
        if (!job) {
            req.flash("error", "Job not found or you don't have permission to update it.");
            return res.redirect("/jobs");
        }

        req.flash("info", "Job updated successfully!");
        res.redirect("/jobs");
    } catch (error) {
        // Handle validation errors
        if (error.constructor.name === "ValidationError") {
            parseValidationErr(error, req);
            // Try to fetch the original job to re-render the form
            const job = await Job.findById(req.params.id);
            return res.render("job", {
                job: { ...job.toObject(), ...req.body },  // Merge attempted changes
                errors: req.flash("error")
            });
        }

        console.error("Error updating job:", error);
        req.flash("error", "Unable to update job. Please try again.");
        res.redirect("/jobs");
    }
};

// Delete a job
const deleteJob = async (req, res) => {
    try {
        // Delete the job, but ONLY if it belongs to the current user
        const result = await Job.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id  // Security check
        });

        // If job doesn't exist or doesn't belong to user
        if (!result) {
            req.flash("error", "Job not found or you don't have permission to delete it.");
            return res.redirect("/jobs");
        }

        req.flash("info", "Job deleted successfully!");
        res.redirect("/jobs");
    } catch (error) {
        console.error("Error deleting job:", error);
        req.flash("error", "Unable to delete job. Please try again.");
        res.redirect("/jobs");
    }
};

module.exports = {
    getAllJobs,
    showNewJobForm,
    createJob,
    showEditJobForm,
    updateJob,
    deleteJob
};