/**
 * Mobile UI thread suffocates even with async scrypt so we let mobile implement scrypt in a worker thread.
 */

// default implementation is the normal one
let scryptImplementation = require('scrypt-async');

function getScrypt() {
    return scryptImplementation;
}

function setScrypt(fn) {
    scryptImplementation = fn;
}

module.exports = { getScrypt, setScrypt };
