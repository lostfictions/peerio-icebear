/**
 * Validates fields in a form.
 */
import { reaction, extendObservable, computed } from 'mobx';

const userValidators = require('./user-validators');

/**
 * Takes an observable store for a form, a field name, as well as validators
 * and an optional position of the field relative to the form, and
 * attaches validation handlers and triggers for validation.
 *
 * onChange and onBlur handlers must be manually attached to the input
 * in peerio-desktop, the ValidatedInput can be used
 *
 * @param {Object} store
 * @param {String} fName -- field name
 * @param {Array<Object>|Object} validatorOrArray
 * @param {Number|undefined} positionInForm [optional]
 */
function addValidation(store, fName, validatorOrArray, positionInForm) {
    const byName = store.byName || {};
    const byOrder = store.byOrder || {};
    // const focus = store.focus || {};
    byName[fName] = positionInForm;
    byOrder[positionInForm] = fName;
    Object.assign(store, { byName, byOrder });

    const fValid = `${fName}Valid`;
    const fValidationMessageComputed = `${fName}ValidationMessage`;
    const fieldValidationMessageText = `${fName}ValidationMessageText`;
    const fDirty = `${fName}Dirty`;
    const fOnChange = `${fName}OnChange`;
    const fOnBlur = `${fName}OnBlur`;
    const fieldValidators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];

    store.validatedFields = store.validatedFields || [];
    store.validatedFields.push(fName);

    store.isValid = store.isValid || (() => store.validatedFields.reduce(
        (acc, field) => acc && !!store[`${field}Valid`], true));

    store.resetValidationState = store.resetValidationState || (
        () => store.validatedFields.forEach(field => {
            store[`${field}Dirty`] = undefined;
            store[`${field}ValidationMessageText`] = undefined;
        }));

    const extend = {};
    if (store[fValid] === undefined) {
        extend[fValid] = false;
    }
    if (store[fieldValidationMessageText] === undefined) {
        extend[fieldValidationMessageText] = '';
    }
    if (store[fValidationMessageComputed] === undefined) {
        // only show error if the field is dirty
        extend[fValidationMessageComputed] = computed(() => {
            return store[fDirty] ? store[fieldValidationMessageText] : '';
        });
    }
    if (store[fDirty] === undefined) {
        extend[fDirty] = false;
    }
    extendObservable(store, extend);

    // mark field (& those before it) as dirty on change
    store[fOnChange] = (val) => {
        store[fDirty] = true;
        store[fName] = val;
        if (positionInForm !== undefined) {
            for (let i = 0; i <= positionInForm; ++i) {
                const otherField = byOrder[i];
                if (otherField) {
                    store[`${otherField}Dirty`] = true;
                }
            }
        }
    };
    // mark the field as dirty when blurred
    store[fOnBlur] = () => {
        store[fDirty] = true;
    };

    // when field changes, reaction is triggered
    reaction(() => store[fName], value => {
        // console.log(`${fName}: ${value} validation run`);
        store[fValid] = false;
        store[fieldValidationMessageText] = '';
        let valid = Promise.resolve(true);
        fieldValidators.forEach(v => {
            const { action, message } = v;
            valid = valid.then(() => {
                return action(value, fName);
            })
            .then(validatorResult => {
                if (validatorResult === true) {
                    return true;
                }
                let m = validatorResult;
                if (validatorResult === false) {
                    m = message;
                } else if (validatorResult && validatorResult.message) {
                    m = validatorResult.message;
                }
                return Promise.reject(new Error(m));
            });
        });
        valid = valid.then(() => {
            // console.log(`${fName} is valid`);
            store[fValid] = true;
            store[fieldValidationMessageText] = '';
        })
        .catch(error => {
            // console.log(`${fName} is invalid`);
                // note computed message will only how up if field is dirty
            store[fValid] = false;
            store[fieldValidationMessageText] = error.message;
        });
        return null;
    }, true);
}


const validation = {
    validators: userValidators,
    addValidation
};

module.exports = validation;
