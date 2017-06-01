// accepts observable array and property name
// returns a map that will be dynamically updated when items are added or removed
// doesn't watch for map key property change

function createMap(array, keyProp) {
    const map = {};

    array.intercept(delta => {
        for (let i = delta.removedCount; i > 0; i--) {
            const el = delta.object[delta.index + i - 1];
            delete map[el[keyProp]];
        }
        delta.added.forEach(el => { map[el[keyProp]] = el; });
    });

    array.forEach(el => {
        map[el[keyProp]] = el;
    });

    return map;
}

module.exports = createMap;
