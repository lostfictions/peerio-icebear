import { reaction, extendObservable } from 'mobx';

const socket = require('../network/socket');

function isValidUsername(name) {
    return Promise.resolve(!!name.match(/^\w{1,16}$/));
}

function isValidEmail(val) {
    const emailRegex = new RegExp(/^[^ ]+@[^ ]+/i);
    return Promise.resolve(!!emailRegex.test(val));
}

function isValid(context, name) {
    return (value, n) => (value ? _callServer(context, name || n, value) : Promise.resolve(false));
}

const isValidSignupEmail = isValid('signup', 'email');
const isValidSignupUsername = isValid('signup', 'username');
const isValidSignupFirstName = isValid('signup', 'firstName');
const isValidSignupLastName = isValid('signup', 'lastName');

function _callServer(context, name, value) {
    return socket.send('/noauth/validate', { context, name, value })
        .then(resp => !!resp && resp.valid)
        .catch(err => {
            console.error(err);
            return false;
        });
}

function isNameValid(name) {
    return Promise.resolve(!name || !!name.match(/^[a-zа-яãâàâåáéèêëîïôûùüÿýçñæœößøòôõóìîíùûúà .\-']{1,20}$/i));
}

function isValidPhone(val) {
    const phoneRegex =
        new RegExp(/^\s*(?:\+?(\d{1,3}))?([-. (]*(\d{3})[-. )]*)?((\d{3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)\s*$/i);
    return Promise.resolve(!!phoneRegex.test(val));
}

function pair(action, message) {
    return { action, message };
}

const emailFormat = pair(isValidEmail, 'error_invalidEmail');
const emailAvailability = pair(isValidSignupEmail, 'addressNotAvailable');
const usernameFormat = pair(isValidUsername, 'usernameNotAvailable');
const usernameAvailability = pair(isValidSignupUsername, 'usernameNotAvailable');
const nameFormat = pair(isNameValid, 'error_invalidName');
const firstNameReserved = pair(isValidSignupFirstName, 'error_invalidName');
const lastNameReserved = pair(isValidSignupLastName, 'error_invalidName');

const validation = {
    isValidUsername,
    isValidEmail,
    isValidSignupEmail,
    isValidSignupFirstName,
    isValidSignupLastName,
    isValidPhone,

    addValidation(s, name, validators) {
        const vName = `${name}Valid`;
        const vmName = `${name}ValidationMessage`;
        const formValid = s.isValid || (() => true);
        s.isValid = () => {
            return s[vName] && formValid();
        };
        const extend = {};
        if (s[vName] === undefined) {
            extend[vName] = false;
        }
        if (s[vmName] === undefined) {
            extend[vmName] = '';
        }
        console.log(extend);
        extendObservable(s, extend);
        reaction(() => s[name], value => {
            s[vName] = false;
            s[vmName] = '';
            let valid = Promise.resolve(true);
            validators.forEach(v => {
                valid = valid.then(r => {
                    return r === true ? v.action(value, name).then(rs => (rs === true ? rs : v.message)) : r;
                });
            });
            valid = valid.then(v => {
                console.log(v);
                if (v === true) {
                    s[vName] = true;
                    s[vmName] = '';
                } else {
                    s[vName] = false;
                    s[vmName] = v;
                }
                // console.log(`update ${name}, ${v}`);
            });
            return null;
        }, true);
    },

    validate(args) {
        return (target, name) => {
            // timeout to let observable initialize properly
            setTimeout(() => validation.addValidation(target, name, args), 0);
        };
    },

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
    lastName: [nameFormat, lastNameReserved]
};

module.exports = validation;
