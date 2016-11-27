/**
 * Validation functions for user-related fields, used in field validation.
 */
const socket = require('../../network/socket');

function isValidUsername(name) {
    return Promise.resolve(!!name.match(/^\w{1,16}$/));
}

function isValidEmail(val) {
    const emailRegex = new RegExp(/^[^ ]+@[^ ]+/i);
    return Promise.resolve(!!emailRegex.test(val));
}

function isValid(context, name) {
    return (value, n) =>
        (value ? _callServer(context, name || n, value) : Promise.resolve(false));
}

function _callServer(context, name, value) {
    return socket.send('/noauth/validate', { context, name, value })
        .then(resp => !!resp && resp.valid)
        .catch(err => {
            console.error(err);
            return false;
        });
}

function isValidName(name) {
    return Promise.resolve(name.length > 0);
}

function isValidPhone(val) { // eslint-disable-line
    const phoneRegex =
              new RegExp(/^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/i);
    return Promise.resolve(!!phoneRegex.test(val));
}

function pair(action, message) {
    return { action, message };
}

const isValidSignupEmail = isValid('signup', 'email');
const isValidSignupUsername = isValid('signup', 'username');
const isValidSignupFirstName = isValid('signup', 'firstName');
const isValidSignupLastName = isValid('signup', 'lastName');
const emailFormat = pair(isValidEmail, 'error_invalidEmail');
const emailAvailability = pair(isValidSignupEmail, 'addressNotAvailable');
const usernameFormat = pair(isValidUsername, 'usernameBadFormat');
const usernameAvailability = pair(isValidSignupUsername, 'usernameNotAvailable');
const nameFormat = pair(isValidName, 'error_invalidName');
const firstNameReserved = pair(isValidSignupFirstName, 'error_invalidName');
const lastNameReserved = pair(isValidSignupLastName, 'error_invalidName');

const validators = {
    /** available validators:
     * {
     *      message: 'error message (string)',
     *      action: function
     * }
     **/
    emailFormat,
    emailAvailability,
    usernameFormat,
    usernameAvailability,
    nameFormat,
    firstNameReserved,
    lastNameReserved,
    email: [emailFormat, emailAvailability],
    username: [usernameFormat, usernameAvailability],
    firstName: [nameFormat, firstNameReserved],
    lastName: [nameFormat, lastNameReserved],
    isValidSignupEmail,
    isValidSignupFirstName,
    isValidSignupLastName
};

module.exports = validators;
