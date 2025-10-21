// File: jobs-ejs/util/get_chai.js
// Utility to handle Chai imports for testing
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const get_chai = async () => {
    return {
        expect: chai.expect,
        request: chai.request
    };
};

module.exports = get_chai;
