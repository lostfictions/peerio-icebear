'use strict';

/**
 * Mobile UI thread suffocates even with async scrypt so we let mobile implement scrypt in a worker thread.
 * @module crypto/scrypt-proxy
 * @public
 */

// default implementation is the normal one
let scryptImplementation = require('scrypt-async');

/**
 * Returns chosen scrypt implementation.
 * @returns {function} scrypt
 * @memberof crypto/scrypt-proxy
 * @public
 */
function getScrypt() {
  return scryptImplementation;
}

/**
 * Sets chosen scrypt implementation.
 * @param {function} fn - scrypt
 * @memberof crypto/scrypt-proxy
 * @public
 */
function setScrypt(fn) {
  scryptImplementation = fn;
}

module.exports = { getScrypt, setScrypt };