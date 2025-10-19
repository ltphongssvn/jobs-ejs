// File: jobs-ejs/tests/test_crud_operations.js
// Tests for job CRUD operations
const { app } = require("../app");
const Job = require("../models/Job");
const { seed_db, testUserPassword, factory } = require("../util/seed_db");
const get_chai = require("../util/get_chai");

describe("job CRUD operations", function () {
    before(async () => {
        const { expect, request } = await get_chai();
        this.test_user = await seed_db();
        let req = request(app).get("/sessions/logon").send();
        let res = await req;
        const textNoLineEnd = res.text.replaceAll("\n", "");
        this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
        let cookies = res.headers["set-cookie"];
        this.csrfCookie = cookies.find((element) =>
            element.startsWith("__Host-csrfToken"),
        );
        const dataToPost = {
            email: this.test_user.email,
            password: testUserPassword,
            _csrf: this.csrfToken,
        };
        req = request(app)
            .post("/sessions/logon")
            .set("Cookie", this.csrfCookie)
            .set("content-type", "application/x-www-form-urlencoded")
            .redirects(0)
            .send(dataToPost);
        res = await req;
        cookies = res.headers["set-cookie"];
        this.sessionCookie = cookies.find((element) =>
            element.startsWith("connect.sid"),
        );
        expect(this.csrfToken).to.not.be.undefined;
        expect(this.sessionCookie).to.not.be.undefined;
        expect(this.csrfCookie).to.not.be.undefined;
    });

    it("should get the job list with 20 entries", async () => {
        const { expect, request } = await get_chai();
        const req = request(app)
            .get("/jobs")
            .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
            .send();
        const res = await req;
        expect(res).to.have.status(200);
        expect(res).to.have.property("text");
        const pageParts = res.text.split("<tr>");
        expect(pageParts.length).to.equal(21);
    });

    it("should add a job entry", async () => {
        const { expect, request } = await get_chai();
        const jobData = await factory.build("job");
        const dataToPost = {
            company: jobData.company,
            position: jobData.position,
            status: jobData.status,
            _csrf: this.csrfToken,
        };
        const req = request(app)
            .post("/jobs")
            .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
            .set("content-type", "application/x-www-form-urlencoded")
            .send(dataToPost);
        const res = await req;
        expect(res).to.have.status(200);
        const jobs = await Job.find({ createdBy: this.test_user._id });
        expect(jobs.length).to.equal(21);
    });
});