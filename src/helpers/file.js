/**
 * Various file helpers
 * @module helpers/file
 * @alias fileHelpers
 * @public
 */

// jsdoc hack..
let a; //eslint-disable-line

/**
 * Extracts file name+extension portion from any path.
 * @param {string} path
 * @returns {string} file name and extension without any parent folders.
 * @memberof helpers/file
 * @public
 */
function getFileName(path) {
    return path.replace(/^.*[\\/]/, '');
}

/**
 * Extracts file name without extension from any path
 * @param {string} path
 * @returns {string} file name without extension
 * @memberof helpers/file
 * @public
 */
function getFileNameWithoutExtension(path) {
    return getFileName(path).replace(/\.\w+$/, '');
}

/**
 * Extracts file extension from any path.
 * @param {string} path
 * @returns {string} file extension
 * @memberof helpers/file
 * @public
 */
function getFileExtension(path) {
    let extension = path.toLocaleLowerCase().match(/\.\w+$/);
    extension = extension ? extension[0].substring(1) : '';
    return extension;
}

module.exports = { getFileName, getFileExtension, getFileNameWithoutExtension };
