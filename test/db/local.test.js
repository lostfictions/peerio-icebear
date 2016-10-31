//
// Local storage module tests
//

const { setEngine, db } = require('../../src/db/local');
// this is a sequenced test suite
describe('local storage model', () => {
    const storeMock = {};
    const engineMock = {
        setValue(k, v) {
            console.log(`set key ${k} to ${v}`);
            storeMock[k] = v;
            return Promise.resolve(v);
        },
        getValue(k) {
            console.log(`get key ${k}`);
            return Promise.resolve(storeMock[k]);
        }
    };
    setEngine(engineMock);

    const k = 'testkey';
    const v = true;
    it('#01 set value',
        () => db.system.set(k, v).then(ret => ret.should.be.true));

    it('#01 get value',
        () => db.system.get(k).then(ret => ret.should.be.true));
});
