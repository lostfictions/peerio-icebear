// applying tests-specific config values as a side effect
require('./config');
require('../build');

const chai = require('chai');

chai.should();

global.expect = chai.expect;
