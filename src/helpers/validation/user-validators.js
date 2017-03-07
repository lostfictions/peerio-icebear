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
const _ = require('lodash');

const VALIDATION_THROTTLING_PERIOD_MS = 400;
const usernameRegex = /^\w{1,16}$/;
const emailRegex = /^[^ ]+@[^ ]+/i;
const phoneRegex =
    /^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/i;

const serverValidationStore = { pendingRequest: null, cachedResult: true };
/**
 * Throttled & promisified call to validation API.
 *
 * @param {String} context -- context for field, e.g "signup"
 * @param {String} name -- field name
 * @param {*} value
 * @returns {Promise<Boolean>}
 * @private
 */
function _callServer(context, name, value) {
    serverValidationStore.pendingRequest = { context, name, value };

    const callThrottled = () => {
        if (serverValidationStore.pendingRequest) {
            const pending = _.clone(serverValidationStore.pendingRequest);
            serverValidationStore.pendingRequest = undefined;
            return socket.send('/noauth/validate', pending)
                .then(resp => {
                    serverValidationStore.cachedResult = !!resp && resp.valid;
                    return Promise.resolve(serverValidationStore.cachedResult);
                })
                .catch(() => {
                    serverValidationStore.cachedResult = false;
                    return Promise.resolve(false);
                });
        }
        // avoid leaving an unresolved promise
        return Promise.resolve(serverValidationStore.cachedResult);
    };

    return Promise
        .delay(VALIDATION_THROTTLING_PERIOD_MS)
        .then(callThrottled);
}

function isValidUsername(name) {
    if (name) {
        return Promise.resolve(!!name.match(usernameRegex));
    }
    return Promise.resolve(false);
}

function isValidEmail(val) {
    return Promise.resolve(emailRegex.test(val));
}

function isValid(context, name) {
    return (value, n) =>
        (value ? _callServer(context, name || n, value) : Promise.resolve(false));
}

function isNonEmptyString(name) {
    return Promise.resolve(name.length > 0);
}

function isValidPhone(val) {
    return Promise.resolve(phoneRegex.test(val));
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
const usernameFormat = pair(isValidUsername, 'error_usernameBadFormat');
const usernameAvailability = pair(isValidSignupUsername, 'error_usernameNotAvailable');
const usernameExistence = pair(isValidLoginUsername, 'error_usernameNotFound');
const stringExists = pair(isNonEmptyString, 'error_fieldRequired');
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
    isValidSignupLastName,
    isValidLoginUsername
};

module.exports = validators;
