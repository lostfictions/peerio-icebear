const Profile = require('./profile');
const Quota = require('./quota');
const tracker = require('../update-tracker');

module.exports = function mixUserRegisterModule() {
    const _profileKeg = new Profile(this.kegDb, this);
    const _quotaKeg = new Quota(this.kegDb, this);

    tracker.onKegTypeUpdated('SELF', 'profile', () => _profileKeg.load());
    tracker.onKegTypeUpdated('SELF', 'quotas', () => _quotaKeg.load());

    this.loadProfile = function() {
        console.log('Loading user profile.');
        return Promise.all([_profileKeg.load(), _quotaKeg.load()]);
    };

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

    // todo: move to quota keg
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
