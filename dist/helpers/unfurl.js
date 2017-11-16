'use strict';

/* eslint-disable no-case-declarations */
/**
* All kinds of unfurl helpers
* @module helpers/unfurl
* @protected
*/

const urlRegex = require('url-regex')();

// url : headers
const urlCache = {};
// url : promise
const urlsInProgress = {};

/**
 * Detects urls in a string and returns them.
 * @param {string} str
 * @returns {Array[string]}
 */
function getUrls(str) {
    if (!str) return [];
    return str.match(urlRegex) || [];
}

function getContentHeaders(url) {
    if (urlCache[url]) return Promise.resolve(urlCache[url]);
    if (urlsInProgress[url]) return urlsInProgress[url];

    const promise = new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        let resolved = false;
        req.onreadystatechange = () => {
            switch (req.readyState) {
                case 1:
                    req.send();
                    break;
                case 2:
                    resolved = true;
                    const res = parseResponseHeaders(req.getAllResponseHeaders());
                    req.abort();
                    urlCache[url] = res;
                    resolve(res);
                    break;
                case 4:
                    // in case we got to DONE(4) without receiving headers
                    if (!resolved) reject(new Error(`${url} request failed`));
                    break;
                default:
                    break;
            }
        };
        req.open('GET', url);
    }).timeout(20000).finally(() => delete urlsInProgress[url]);

    urlsInProgress[url] = promise;
    return promise;
}

function parseResponseHeaders(headerStr) {
    const headers = {};
    if (!headerStr) {
        return headers;
    }
    const headerPairs = headerStr.split('\u000d\u000a');
    for (let i = 0; i < headerPairs.length; i++) {
        const headerPair = headerPairs[i];
        // Can't use split() here because it does the wrong thing
        // if  header value has ": " in it.
        const index = headerPair.indexOf(': ');
        if (index > 0) {
            const key = headerPair.substring(0, index).toLowerCase();
            const val = headerPair.substring(index + 2);
            headers[key] = val;
        }
    }
    return headers;
}

module.exports = { getUrls, getContentHeaders, urlCache };