/**
 * Validation functions for user-related fields, used in field validation.
 *
 * On *peerio-desktop* they are used in conuction with the ValidatedInput and OrderedFormStore
 * components. ValidatedInputs expect validators of the format below as parameters,
 * and will run through them on change & blur as needed.
 *
 * Validators are (arrays of) objects, with signature:
 *  {
 *      action: 'function',
 *      message: ''
 *  }
 *
 *  The action function accepts arguments:
 *  - value -- usually a string
 *  - additionalArguments -- optional object
 *
 *  It returns true if the value passes validation. Otherwise it may return an
 *  object with the signature:
 *
 *  {
 *      message: 'optional specific validation message (string)',
 *      result: false
 *      // additional data as needed
 *  }
 *
 *  if the function does not return a message, the default message provided by the
 *  validator will be used.
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

function isNonEmptyString(name) {
    return Promise.resolve(name.length > 0);
}

function isValidPhone(val) { // eslint-disable-line
    const phoneRegex =
              new RegExp(/^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/i);
    return Promise.resolve(!!phoneRegex.test(val));
}

function isValidLoginUsername(name) {
    return isValid('signup', 'username')(name)
        .then((value) => !value);
}


function areEqualValues(value, additionalArguments) {
    if (value === additionalArguments.equalsValue) return Promise.resolve(true);
    return Promise.resolve({
        result: false,
        message: additionalArguments.equalsErrorMessage
    });
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
const usernameExistence = pair(isValidLoginUsername, 'usernameNotFound');
const stringExists = pair(isNonEmptyString, 'error_invalidName');
const firstNameReserved = pair(isValidSignupFirstName, 'error_invalidName');
const lastNameReserved = pair(isValidSignupLastName, 'error_invalidName');
const valueEquality = pair(areEqualValues, 'error_mustMatch');

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
    stringExists,
    firstNameReserved,
    lastNameReserved,
    email: [emailFormat, emailAvailability],
    username: [usernameFormat, usernameAvailability],
    usernameLogin: [usernameFormat, usernameExistence],
    firstName: [stringExists, firstNameReserved],
    lastName: [stringExists, lastNameReserved],
    valueEquality,
    isValidSignupEmail,
    isValidSignupFirstName,
    isValidSignupLastName
};

module.exports = validators;
