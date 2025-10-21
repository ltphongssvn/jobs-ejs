// File: jobs-ejs/tests/test_multiply.js
// Unit test for multiply function

const multiply = require("../util/multiply");
const get_chai = require("../util/get_chai");

describe("testing multiply", () => {
    it("should give 7*6 is 42", async () => {
        const { expect } = await get_chai();
        expect(multiply(7, 6)).to.equal(42);
    });
});