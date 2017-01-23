/* eslint-disable */
//
// Local storage module tests
//

const db = require('../../src/db/tiny-db');
// this is a sequenced test suite
describe('local storage model', () => {
    const storeMock = {};
    const engineMock = {
        setValue(k, v) {
            storeMock[k] = v;
            return Promise.resolve(v);
        },
        getValue(k) {
            return Promise.resolve(storeMock[k]);
        },
        removeValue(k) {
            delete storeMock[k];
            return Promise.resolve();
        }
    };
    db.setEngine(engineMock);

    const k = 'testkey';
    const v = true;
    it('#01 set value',
        () => db.set(k, v).then(ret => ret.should.be.true));

    it('#02 get value',
        () => db.get(k).then(ret => ret.should.be.true));

    it('#03 removes a value',
        () => db.remove(k).then(() => {
            should.not.exist(storeMock[k]);
        }));
});
