const defineSupportCode = require('cucumber').defineSupportCode;

defineSupportCode(({ setDefaultTimeout, defineParameterType }) => {
    setDefaultTimeout(10000);

    defineParameterType({
        regexp: /(Blobs should be of ArrayBuffer type|Blobs array length should be 2|Already saving avatar, wait for it to finish.)/, // eslint-disable-line
        name: 'err'
    });
});
