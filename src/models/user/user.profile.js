const Profile = require('./profile');
const Quota = require('./quota');
const tracker = require('../update-tracker');
const { retryUntilSuccess } = require('../../helpers/retry.js');

module.exports = function mixUserRegisterModule() {
    const _profileKeg = new Profile(this.kegDb, this);
    const _quotaKeg = new Quota(this.kegDb, this);

    this.loadProfile = (force) => {
        const digest = tracker.getDigest('SELF', 'profile');
        if (!force && digest.maxUpdateId <= _profileKeg.collectionVersion) return;
        retryUntilSuccess(() => _profileKeg.load().then(this.loadProfile), 'Profile Load');
    };

    this.loadQuota = (force) => {
        const digest = tracker.getDigest('SELF', 'quota');
        if (!force && digest.maxUpdateId <= _quotaKeg.collectionVersion) return;
        retryUntilSuccess(() => _quotaKeg.load().then(this.loadQuota), 'Quota Load');
    };

    // will be triggered first time after login
    tracker.onKegTypeUpdated('SELF', 'profile', this.loadProfile);
    tracker.onKegTypeUpdated('SELF', 'quotas', this.loadQuota);

    this.saveProfile = function() {
        return _profileKeg.saveToServer();
    };

    // todo: move to quota keg, make computed
    this.canSendGhost = function() {
        const q = this.quota;
        if (q && q.quotasLeft && q.quotasLeft.ghost) {
            const qTotal = q.quotasLeft.ghost.find(i => i.period === 'monthly');
            if (!qTotal) return true;
            return qTotal.limit > 0;
        }
        return true;
    };

    // todo move to quota keg
    // todo: take chunk overhead into account
    this.canUploadFileSize = function(size) {
        const q = this.quota;
        if (q && q.quotasLeft && q.quotasLeft.file) {
            const qTotal = q.quotasLeft.file.find(i => i.period === 'total');
            if (!qTotal) return true;
            return qTotal.limit > size;
        }
        return true;
    };
};
