// File: jobs-ejs/util/seed_db.js
// Database seeding utility for testing
const Job = require("../models/Job");
const User = require("../models/User");
const faker = require("@faker-js/faker").fakerEN_US;
const { Factory } = require("fishery");
require("dotenv").config();

const testUserPassword = faker.internet.password();

// Define factories
const jobFactory = Factory.define(({ onCreate }) => {
    onCreate(attrs => Job.create(attrs));

    return {
        company: faker.company.name(),
        position: faker.person.jobTitle(),
        status: ["interview", "declined", "pending"][Math.floor(3 * Math.random())]
    };
});

const userFactory = Factory.define(({ onCreate }) => {
    onCreate(attrs => User.create(attrs));

    return {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: testUserPassword
    };
});

// Wrapper to match old factory-bot API
const factory = {
    build: async (model, attrs = {}) => {
        if (model === "user") return userFactory.build(attrs);
        if (model === "job") return jobFactory.build(attrs);
    },
    create: async (model, attrs = {}) => {
        if (model === "user") return userFactory.create(attrs);
        if (model === "job") return jobFactory.create(attrs);
    },
    createMany: async (model, count, attrs = {}) => {
        if (model === "job") {
            const jobs = [];
            for (let i = 0; i < count; i++) {
                jobs.push(await jobFactory.create(attrs));
            }
            return jobs;
        }
    }
};

const seed_db = async () => {
    try {
        await User.deleteMany({});
        await Job.deleteMany({});
        const testUser = await factory.create("user");
        await factory.createMany("job", 20, { createdBy: testUser._id });
        return testUser;  // Added return statement
    } catch (e) {
        console.log("database error");
        console.log(e.message);
        throw e;
    }
};

module.exports = { testUserPassword, factory, seed_db };