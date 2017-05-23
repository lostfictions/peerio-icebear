const { when } = require('mobx');

function asPromise(object, observableProperty, expectedValue) {
    return new Promise(resolve => {
        when(() => object[observableProperty] === expectedValue, resolve);
    });
}

module.exports = { asPromise };
