/**
 * @namespace helpers/dynamic-array-map
 * @protected
 */

// jsdoc hack..
let a;//eslint-disable-line

/**
 * Creates a map object that will be dynamically updated when items are added or removed to the passed array.
 * Doesn't watch for map key property change.
 * @param {ObservableArray<object>} array - array to create map for
 * @param {any} keyProp - property of the items in the array that will be used as key for the map
 * @returns {object} - map object
 * @memberof helpers/dynamic-array-map
 * @protected
 */
function createMap(array, keyProp) {
    const map = {};

    array.intercept(delta => {
        for (let i = delta.removedCount; i > 0; i--) {
            const el = delta.object[delta.index + i - 1];
            delete map[el[keyProp]];
        }
        delta.added.forEach(el => { map[el[keyProp]] = el; });
        return delta;
    });

    array.forEach(el => {
        map[el[keyProp]] = el;
    });

    return map;
}

module.exports = createMap;
