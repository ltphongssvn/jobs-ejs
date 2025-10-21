// File: jobs-ejs/tests/test_puppeteer.js
// Puppeteer browser automation tests

const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../util/seed_db");
const Job = require("../models/Job");
const { factory } = require("../util/seed_db");

let testUser = null;

let page = null;
let browser = null;

describe("jobs-ejs puppeteer test", function () {
    before(async function () {
        this.timeout(10000);
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto("http://localhost:3000");
    });

    after(async function () {
        this.timeout(5000);
        await browser.close();
    });

    describe("got to site", function () {
        it("should have completed a connection", async function () {});
    });

    describe("index page test", function () {
        this.timeout(10000);
        it("finds the index page logon link", async () => {
            this.logonLink = await page.waitForSelector(
                "a ::-p-text(Click here to log on)",
            );
        });
        it("gets to the logon page", async () => {
            await this.logonLink.click();
            await page.waitForNavigation();
            const email = await page.waitForSelector('input[name="email"]');
        });
    });

    describe("logon page test", function () {
        this.timeout(20000);
        it("resolves all the fields", async () => {
            this.email = await page.waitForSelector('input[name="email"]');
            this.password = await page.waitForSelector('input[name="password"]');
            this.submit = await page.waitForSelector("button ::-p-text(Logon)");
        });
        it("sends the logon", async () => {
            testUser = await seed_db();
            await this.email.type(testUser.email);
            await this.password.type(testUserPassword);
            await this.submit.click();
            await page.waitForNavigation();
            await page.waitForSelector(`p ::-p-text(${testUser.name})`);
            await page.waitForSelector("a ::-p-text(View/Change Secret Word)");
            await page.waitForSelector('a[href="/secretWord"]');
            const copyr = await page.waitForSelector("p ::-p-text(copyright)");
            const copyrText = await copyr.evaluate((el) => el.textContent);
            console.log("copyright text: ", copyrText);
        });
    });

    describe("puppeteer job operations", function () {
        this.timeout(20000);

        it("should click on jobs list link and verify 20 entries", async () => {
            const { expect } = await import('chai');
            const jobsLink = await page.waitForSelector('a[href="/jobs"]');
            await jobsLink.click();
            await page.waitForNavigation();
            const pageContent = await page.content();
            const pageParts = pageContent.split("<tr>");
            expect(pageParts.length).to.equal(21);
        });

        it("should click Add A Job button and wait for form", async () => {
            const { expect } = await import('chai');
            // Try multiple selectors for the add job link
            const addButton = await page.waitForSelector('a[href="/jobs/new"], a ::-p-text(Add), button ::-p-text(Add)');
            await addButton.click();
            await page.waitForNavigation();
            this.companyField = await page.waitForSelector('input[name="company"]');
            this.positionField = await page.waitForSelector('input[name="position"]');
            this.addJobButton = await page.waitForSelector('button[type="submit"]');
            expect(this.companyField).to.not.be.null;
            expect(this.positionField).to.not.be.null;
        });

        it("should add a new job and verify in database", async () => {
            const { expect } = await import('chai');
            // Check if fields are defined from previous test
            if (!this.companyField || !this.positionField || !this.addJobButton) {
                this.skip();
            }
            const jobData = await factory.build("job");
            await this.companyField.type(jobData.company);
            await this.positionField.type(jobData.position);
            await this.addJobButton.click();
            await page.waitForNavigation();
            await page.waitForSelector('p ::-p-text(added), h1 ::-p-text(Jobs)');
            const jobs = await Job.find({ createdBy: testUser._id });
            expect(jobs.length).to.equal(21);
            const latestJob = jobs[jobs.length - 1];
            expect(latestJob.company).to.equal(jobData.company);
            expect(latestJob.position).to.equal(jobData.position);
        });
    });
});