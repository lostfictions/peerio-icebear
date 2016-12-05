/**
 * Validates fields in a form.
 */
import { reaction, extendObservable, computed } from 'mobx';

const _ = require('lodash');
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
    const fValid = `${fName}Valid`;
    const fValidationMessageComputed = `${fName}ValidationMessage`;
    const fieldValidationMessageText = `${fName}ValidationMessageText`;
    const fDirty = `${fName}Dirty`;
    const fOnChange = `${fName}OnChange`;
    const fOnBlur = `${fName}OnBlur`;
    const formValid = store.isValid || (() => true);
    const fieldValidators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];

    store.isValid = () => {
        return store[fValid] && formValid();
    };
    const extend = {};
    store.fieldOrders = store.fieldOrders || {};
    store.fieldOrders[fName] = positionInForm;
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
            _.each(store.fieldOrders, (otherPosition, otherField) => {
                if (otherPosition < positionInForm) {
                    store[`${otherField}Dirty`] = true;
                }
            });
        }
    };
    // mark the field as dirty when blurred
    store[fOnBlur] = (val) => {
        store[fDirty] = true;
    };

    // when field changes, reaction is triggered
    reaction(() => store[fName], value => {
        console.log(`${fName} validation run`);
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
                const error = new Error();
                if (validatorResult === false) {
                    error.message = message;
                } else if (validatorResult.message) {
                    error.message = validatorResult.message;
                } else {
                    error.message = validatorResult;
                }
                return Promise.reject(error);
            });
        });
        valid = valid.then(() => {
            console.log(`${fName} is valid`);
            store[fValid] = true;
            store[fieldValidationMessageText] = '';
        })
        .catch(error => {
            console.log(`${fName} is invalid`);
                // note computed message will only how up if field is dirty
            store[fValid] = false;
            store[fieldValidationMessageText] = error.message;
        });
        return null;
    }, true);
}


const validation = {
    /**
     * Decorator. Usage: @validateField(myValidators, positionInForm) target
     *
     * @param myValidators
     * @param positionInForm
     * @returns {function()}
     */
    validateField(myValidators, positionInForm) {
        // decorator has a target (the form store) & name
        return (target, name) => {
            // timeout to let observable initialize properly
            setTimeout(() => addValidation(target, name, myValidators, positionInForm), 0);
        };
    },

    /** available validators: fn or array of fns **/
    validators: userValidators
};

module.exports = validation;
